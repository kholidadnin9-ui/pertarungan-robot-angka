import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Bot, Crown, Heart, Home, RotateCcw, Star, Trophy, Volume2, VolumeX, Wrench,
} from 'lucide-react';
import {
  MAX_HP, OOPS, PRAISES, TOTAL_QUESTIONS, type LevelDef, type RobotDef,
} from '../game/data';
import { buildQuestions } from '../game/questions';
import { isMuted, setMuted, sfx, speak, stopSpeak } from '../game/sound';
import { useTransparent } from '../game/transparency';
import {
  ElectricShock, Embers, Explosion, LaserShot, MuzzleCharge, MuzzleFlash, SparkBurst, StarRain,
} from './Effects';

type Side = 'p1' | 'p2';
type Phase = 'question' | 'charge' | 'fire' | 'resolve';

const CHARGE_MS = 380;
const TRAVEL_MS = 300;

interface Shot {
  correct: boolean;
  shooter: Side;
  sx: number; sy: number; ex: number; ey: number;
  aw: number; ah: number;
  key: number;
}

interface Done {
  stars: number;
  winner: Side | 'draw' | 'none';
  score1: number; score2: number;
  ex: number; ey: number;
}

const BTN_STYLES = [
  { grad: 'from-amber-400 to-orange-500', border: '#9a3412', spark: '#fde047' },
  { grad: 'from-sky-400 to-cyan-500', border: '#075985', spark: '#7dd3fc' },
  { grad: 'from-fuchsia-400 to-purple-600', border: '#6b21a8', spark: '#e879f9' },
];

/* ---------------- Robot figure ---------------- */
interface FigureProps {
  robot: RobotDef;
  mirrored?: boolean;
  active: boolean;
  state: 'idle' | 'charge' | 'fire' | 'hit' | 'shock';
  hp: number;
  down: boolean;
  size: string;
}

const RobotFigure = forwardRef<HTMLDivElement, FigureProps>(
  ({ robot, mirrored, active, state, hp, down, size }, ref) => {
    const src = useTransparent(robot.img);
    const lean = mirrored ? 20 : -20;
    const dim = 0.45 + 0.55 * (hp / MAX_HP);
    const shakeClass = state === 'shock' ? 'shock-shake' : state === 'hit' ? 'hit-shake' : '';
    const filterClass =
      state === 'hit' ? 'charred' : state === 'shock' ? 'shock-glow' : down ? 'charred' : '';
    const baseFilter =
      state === 'hit' || state === 'shock' || down
        ? ''
        : `brightness(${dim}) saturate(${0.65 + 0.35 * (hp / MAX_HP)}) drop-shadow(0 0 18px ${robot.glow})`;
    const filterStyle = { filter: baseFilter || undefined };

    return (
      <div ref={ref} className="battle-robot-figure relative" style={{ width: size }}>
        {/* platform glow */}
        <div
          className="absolute right-[8%] bottom-[-4%] left-[8%] h-[12%] rounded-[100%] blur-md"
          style={{ background: `radial-gradient(ellipse, ${robot.glow}, transparent 70%)` }}
        />

        {/* active turn ring */}
        {active && !down && (
          <div
            className="glow-pulse absolute right-[16%] bottom-[-6%] left-[16%] h-[10%] rounded-[100%] border-4 blur-[1px]"
            style={{ borderColor: robot.color, boxShadow: `0 0 24px ${robot.color}` }}
          />
        )}

        <div className="animate-floaty">
          <div className={shakeClass}>
            <motion.div
              animate={
                down
                  ? { rotate: mirrored ? 78 : -78, y: 130, x: 0, opacity: 0.92 }
                  : {
                      x: state === 'charge' || state === 'fire' ? lean : 0,
                      scale: state === 'fire' ? 1.03 : 1,
                      rotate: 0,
                      y: 0,
                      opacity: 1,
                    }
              }
              transition={
                down
                  ? { duration: 0.75, ease: 'easeIn' }
                  : state === 'charge'
                    ? { duration: CHARGE_MS / 1000, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 340, damping: 13 }
              }
            >
              <img
                src={src ?? robot.img}
                alt={robot.name}
                draggable={false}
                className={`pointer-events-none h-auto w-full select-none transition-opacity duration-200 ${
                  mirrored ? '-scale-x-100' : ''
                } ${src ? 'opacity-100' : 'opacity-0'} ${filterClass}`}
                style={filterStyle}
              />
            </motion.div>
          </div>
        </div>

        {state === 'shock' && <ElectricShock />}

        {/* glowing muzzle beacon so kids can see where the laser comes from */}
        {(state === 'charge' || state === 'fire') && (
          <div
            className="glow-pulse pointer-events-none absolute z-30 rounded-full"
            style={{
              left: `${(mirrored ? 1 - robot.muzzle.x : robot.muzzle.x) * 100}%`,
              top: `${robot.muzzle.y * 100}%`,
              width: '9%',
              aspectRatio: '1',
              transform: 'translate(-50%,-50%)',
              background: `radial-gradient(circle, #fff 0%, ${robot.laser} 45%, transparent 70%)`,
              boxShadow: `0 0 34px ${robot.laser}`,
            }}
          />
        )}

        {state === 'shock' && <ElectricShock />}

        {active && !down && (
          <div
            className="font-tech absolute -top-8 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black tracking-widest whitespace-nowrap md:text-xs"
            style={{ background: robot.color, color: '#0b1120' }}
          >
            GILIRANMU!
          </div>
        )}
      </div>
    );
  },
);

RobotFigure.displayName = 'RobotFigure';

/* ---------------- Battle screen ---------------- */
export function Battle({
  mode,
  level,
  robot1,
  robot2,
  onExit,
  onReplay,
  onNext,
  onStars,
  computerThinkTime = 10,
}: {
  mode: 1 | 2;
  computerThinkTime?: 5 | 10 | 15;
  level: LevelDef;
  robot1: RobotDef;
  robot2: RobotDef;
  onExit: () => void;
  onReplay: () => void;
  onNext: (() => void) | null;
  onStars: (stars: number) => void;
}) {
  const questions = useMemo(() => buildQuestions(level), [level]);
  const [qIdx, setQIdx] = useState(0);
  const [turn, setTurn] = useState<Side>('p1');
  const [hp, setHp] = useState<Record<Side, number>>({ p1: MAX_HP, p2: MAX_HP });
  const [results, setResults] = useState<('ok' | 'no')[]>([]);
  const [phase, setPhase] = useState<Phase>('question');
  const [shot, setShot] = useState<Shot | null>(null);
  const [picked, setPicked] = useState<{ side: Side; idx: number } | null>(null);
  const [banner, setBanner] = useState<{
    text: string;
    sub?: string;
    good: boolean;
    key: number;
  } | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const [aiSecondsLeft, setAiSecondsLeft] = useState<number | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const doneRef = useRef(false);
  const claimedRef = useRef<Side | null>(null);
  const scoreRef = useRef<Record<Side, number>>({ p1: 0, p2: 0 });

  const q = questions[qIdx];

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopSpeak();
    },
    [],
  );

  /* read question aloud */
  useEffect(() => {
    if (phase !== 'question' || done) return;

    const t = window.setTimeout(() => speak(q.speech), 420);

    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, phase, done]);

  function later(fn: () => void, ms: number) {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }

  /** Anchor of the arm-cannon muzzle or chest. */
  function pointFor(
    ref: React.RefObject<HTMLDivElement | null>,
    which: 'muzzle' | 'chest',
    mirrored: boolean,
    robot?: RobotDef,
  ) {
    const a = arenaRef.current;
    const r = ref.current;

    if (!a || !r) return { x: 200, y: 200 };

    const ab = a.getBoundingClientRect();
    const rb = r.getBoundingClientRect();

    if (which === 'muzzle' && robot) {
      const m = robot.muzzle;
      const fx = mirrored ? 1 - m.x : m.x;

      return {
        x: rb.left - ab.left + rb.width * fx,
        y: rb.top - ab.top + rb.height * m.y,
      };
    }

    let fx = 0.5;
    let fy = 0.34;

    if (which === 'muzzle') {
      fx = mirrored ? 0.075 : 0.925;
      fy = 0.255;
    }

    return {
      x: rb.left - ab.left + rb.width * fx,
      y: rb.top - ab.top + rb.height * fy,
    };
  }

  function fire(shooter: Side, optIdx: number) {
    if (phase !== 'question' || done || claimedRef.current) return;

    claimedRef.current = shooter;
    stopSpeak();

    const correct = optIdx === q.answer;

    const sRef = shooter === 'p1' ? p1Ref : p2Ref;
    const tRef = shooter === 'p1' ? p2Ref : p1Ref;
    const sMir = shooter === 'p2';
    const shooterRobot = shooter === 'p1' ? robot1 : robot2;

    const start = pointFor(sRef, 'muzzle', sMir, shooterRobot);
    const end = pointFor(tRef, 'chest', !sMir);

    // robot leans back while charging
    start.x += shooter === 'p1' ? -20 : 20;
    end.x += (Math.random() - 0.5) * 22;
    end.y += (Math.random() - 0.5) * 14;

    const ab = arenaRef.current?.getBoundingClientRect();

    setPicked({ side: shooter, idx: optIdx });

    setShot({
      correct,
      shooter,
      sx: start.x,
      sy: start.y,
      ex: end.x,
      ey: end.y,
      aw: ab?.width ?? 1000,
      ah: ab?.height ?? 600,
      key: Date.now(),
    });

    /* 1. energy gathers in cannon barrel */
    setPhase('charge');
    sfx.charge();

    /* 2. fire the laser */
    later(() => {
      setPhase('fire');
      sfx.laser();
    }, CHARGE_MS);

    /* 3. resolve after laser travel */
    later(() => {
      setPhase('resolve');

      const defender: Side = shooter === 'p1' ? 'p2' : 'p1';

      if (correct) {
        sfx.explosion();
        sfx.correct();

        setShakeKey((k) => k + 1);

        setHp((h) => ({
          ...h,
          [defender]: Math.max(2, h[defender] - 20),
        }));

        scoreRef.current = {
          ...scoreRef.current,
          [shooter]: scoreRef.current[shooter] + 1,
        };

        setResults((r) => [...r, 'ok']);

        setBanner({
          text:
            (mode === 2 ? pName(shooter) + ': ' : '') +
            PRAISES[Math.floor(Math.random() * PRAISES.length)],
          sub: 'Robot lawan meledak dan hangus!',
          good: true,
          key: Date.now(),
        });
      } else {
        sfx.zap();
        sfx.wrong();

        setHp((h) => ({
          ...h,
          [shooter]: Math.max(2, h[shooter] - 10),
        }));

        setResults((r) => [...r, 'no']);

        setBanner({
          text:
            (mode === 2 ? pName(shooter) + ' ' : '') +
            'KESETRUM! ' +
            OOPS[Math.floor(Math.random() * OOPS.length)],
          sub: `Jawaban yang benar: ${q.options[q.answer].toUpperCase()}`,
          good: false,
          key: Date.now(),
        });
      }
    }, CHARGE_MS + TRAVEL_MS + 60);

    /* next question / finish */
    later(() => {
      setShot(null);
      setBanner(null);
      setPicked(null);
      claimedRef.current = null;

      if (qIdx + 1 >= TOTAL_QUESTIONS) {
        finishGame();
      } else {
        setQIdx((i) => i + 1);

        if (mode === 1) {
          // Mode versus komputer: giliran bergantian antara pemain dan AI.
          setTurn(shooter === 'p1' ? 'p2' : 'p1');
        }

        setPhase('question');
      }
    }, CHARGE_MS + TRAVEL_MS + 60 + 2100);
  }

  // Komputer otomatis menjawab pada gilirannya dalam mode 1 pemain.
  // Nilai computerThinkTime dapat diatur dari App.tsx menjadi 5, 10, atau 15 detik.
  useEffect(() => {
    if (mode !== 1 || turn !== 'p2' || phase !== 'question' || done || !q) {
      setAiSecondsLeft(null);
      return;
    }

    let secondsLeft = computerThinkTime;
    setAiSecondsLeft(secondsLeft);

    const countdown = window.setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      setAiSecondsLeft(secondsLeft);
    }, 1000);

    const answerTimer = window.setTimeout(() => {
      // AI benar sekitar 75% dari waktu; jika salah, pilih opsi salah.
      let answerIndex: number;
      if (Math.random() < 0.75) {
        answerIndex = q.answer;
      } else {
        const wrongOptions = q.options
          .map((_, index) => index)
          .filter((index) => index !== q.answer);
        answerIndex = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] ?? q.answer;
      }
      fire('p2', answerIndex);
    }, computerThinkTime * 1000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(answerTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, phase, qIdx, done, computerThinkTime]);

  function finishGame() {
    if (doneRef.current) return;

    doneRef.current = true;

    const final1 = scoreRef.current.p1;
    const final2 = scoreRef.current.p2;

    let winner: Done['winner'] = 'none';
    let stars = 0;

    if (mode === 1) {
      stars = final1 >= 9 ? 3 : final1 >= 7 ? 2 : final1 >= 6 ? 1 : 0;
      winner = final1 >= 6 ? 'p1' : 'none';
    } else {
      winner = final1 > final2 ? 'p1' : final2 > final1 ? 'p2' : 'draw';
    }

    const loser: Side | null =
      winner === 'p1' ? 'p2' : winner === 'p2' ? 'p1' : null;

    const lp = loser
      ? pointFor(
          loser === 'p1' ? p1Ref : p2Ref,
          'chest',
          loser === 'p2',
        )
      : { x: 500, y: 300 };

    setDone({
      stars,
      winner,
      score1: final1,
      score2: final2,
      ex: lp.x,
      ey: lp.y,
    });

    if (winner === 'none' || winner === 'draw') {
      sfx.wrong();
    } else {
      sfx.bigExplosion();
      later(() => sfx.fanfare(), 900);
    }

    if (mode === 1) {
      onStars(stars);
    }
  }

  const pName = (s: Side) =>
    mode === 2 ? `PEMAIN ${s === 'p1' ? 1 : 2}` : 'KAMU';

  /* figure states */
  const stateFor = (side: Side): FigureProps['state'] => {
    if (done) return 'idle';
    if (!shot) return 'idle';

    if (phase === 'charge' && shot.shooter === side) {
      return 'charge';
    }

    if (phase === 'fire' && shot.shooter === side) {
      return 'fire';
    }

    if (phase === 'resolve') {
      if (shot.correct && shot.shooter !== side) {
        return 'hit';
      }

      if (!shot.correct && shot.shooter === side) {
        return 'shock';
      }
    }

    return 'idle';
  };

  const downFor = (side: Side): boolean =>
    !!done &&
    (done.winner === side
      ? false
      : done.winner === 'draw' || done.winner === 'none'
        ? side === 'p1' && mode === 1
        : true);

  return (
    <div className="battle-screen fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#05070f]">
      <style>{`
        /* Khusus HP landscape: utamakan soal dan pilihan jawaban agar selalu terbaca. */
        @media (orientation: landscape) and (max-height: 520px) {
          .battle-hud { padding: 4px 10px 0 !important; align-items: center !important; }
          .battle-hud .font-tech { line-height: 1.05 !important; }
          .battle-question-panel {
            top: 2px !important;
            max-width: 94vw !important;
            max-height: 43dvh !important;
            overflow: auto !important;
            padding: 5px 10px !important;
            border-radius: 12px !important;
          }
          .battle-question-panel .battle-hint { font-size: 8px !important; letter-spacing: .12em !important; }
          .battle-question-panel .battle-prompt { font-size: clamp(19px, 5.2dvh, 30px) !important; line-height: 1.05 !important; }
          .battle-question-panel .battle-count-items { margin: 2px 0 !important; gap: 3px !important; }
          .battle-question-panel .battle-count-items svg { width: clamp(15px, 4dvh, 23px) !important; height: clamp(15px, 4dvh, 23px) !important; }
          .battle-question-panel .battle-count-items .battle-count-symbol { font-size: clamp(20px, 5dvh, 28px) !important; }
          .battle-question-panel .battle-listen { margin-top: 3px !important; padding: 2px 8px !important; font-size: 9px !important; }
          .battle-robots { padding: 0 4vw 2px !important; }
          .battle-robot-figure { width: clamp(68px, 22dvh, 112px) !important; }
          .battle-answers { gap: 5px !important; padding: 3px 8px max(env(safe-area-inset-bottom), 3px) !important; }
          .battle-answers .reticle { min-height: 30px !important; padding: 3px 5px !important; border-bottom-width: 3px !important; border-radius: 9px !important; }
          .battle-answers .reticle span:not(.rc) { font-size: clamp(12px, 3.6dvh, 19px) !important; line-height: 1 !important; }
          .battle-answer-bank { min-width: 0 !important; flex: 1 1 0 !important; padding: 3px !important; border-radius: 9px !important; }
          .battle-answer-bank > div:first-child { margin-bottom: 3px !important; font-size: 8px !important; letter-spacing: .1em !important; }
          .battle-answer-bank > div:last-child { gap: 3px !important; }
        }
      `}</style>
      {/* battlefield background */}
      <img
        src={`${import.meta.env.BASE_URL}bg/battlefield.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-linear-to-b from-[#04060e]/80 via-transparent to-[#04060e]/85" />

      <Embers count={14} />

      {/* shakeable arena */}
      <div
        key={shakeKey}
        className={`relative z-10 flex h-full min-h-0 flex-col ${
          shakeKey > 0 ? 'screen-shake' : ''
        }`}
      >
        {/* ------- HUD ------- */}
        <div className="battle-hud flex items-start justify-between gap-2 px-3 pt-3 md:px-6">
          <PlayerChip
            side="P1"
            name={mode === 2 ? 'PEMAIN 1' : 'KAMU'}
            robot={robot1}
            hp={hp.p1}
            active={mode === 2 ? !done : turn === 'p1' && !done}
            color="#38bdf8"
          />

          <div className="flex flex-col items-center pt-1">
            <div
              className="font-tech rounded-full px-4 py-1 text-xs font-black tracking-widest md:text-sm"
              style={{
                background: level.color,
                color: '#0b1120',
                boxShadow: `0 0 20px ${level.color}66`,
              }}
            >
              {level.label}
            </div>

            <div className="mt-2 flex gap-1">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full md:h-3 md:w-3"
                  style={{
                    background:
                      i < results.length
                        ? results[i] === 'ok'
                          ? '#34d399'
                          : '#fb7185'
                        : i === qIdx
                          ? '#fbbf24'
                          : 'rgba(255,255,255,.22)',
                    boxShadow:
                      i === qIdx ? '0 0 8px #fbbf24' : 'none',
                  }}
                />
              ))}
            </div>

            <div className="font-tech mt-1.5 text-[10px] font-bold tracking-widest text-slate-300 md:text-xs">
              SOAL {Math.min(qIdx + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
            </div>
          </div>

          <PlayerChip
            side="P2"
            name={mode === 2 ? 'PEMAIN 2' : 'KOMPUTER'}
            robot={robot2}
            hp={hp.p2}
            active={mode === 2 ? !done : turn === 'p2' && !done}
            color="#f472b6"
            right
            icon={mode === 1}
          />
        </div>

        {/* ------- arena mid ------- */}
        <div ref={arenaRef} className="relative min-h-0 flex-1">
          {/* race hint (2P realtime) */}
          {mode === 2 && !done && phase === 'question' && (
            <div className="absolute top-1 left-1/2 z-20 -translate-x-1/2">
              <span
                className="font-tech glow-pulse rounded-full border-2 border-white/30 px-4 py-1.5 text-xs font-black tracking-widest md:text-sm"
                style={{
                  background: 'linear-gradient(90deg,#38bdf8,#f472b6)',
                  color: '#0b1120',
                }}
              >
                SIAPA PALING CEPAT?!
              </span>
            </div>
          )}

          {/* question panel */}
          <motion.div
            key={qIdx}
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className={`battle-question-panel holo scanlines absolute top-6 left-1/2 z-20 w-max max-w-[94vw] -translate-x-1/2 overflow-hidden rounded-2xl px-3 py-1.5 text-center sm:top-7 sm:px-4 sm:py-2 md:top-10 md:rounded-3xl md:px-10 md:py-4 ${
              done ? 'opacity-30' : ''
            }`}
          >
            <div className="scan-sweep pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-cyan-300/10 to-transparent" />

            {mode === 1 && turn === 'p2' && !done && phase === 'question' && (
              <div className="mb-1 font-tech text-[10px] font-black tracking-widest text-pink-300 md:text-xs">
                KOMPUTER BERPIKIR... {aiSecondsLeft ?? computerThinkTime} DETIK
              </div>
            )}

            <div className="battle-hint font-tech text-[10px] font-bold tracking-[0.3em] text-cyan-300 md:text-xs">
              {q.hint}
            </div>

            {q.kind === 'count' ? (
              <div className="battle-count-items my-1.5 flex flex-wrap items-center justify-center gap-1.5">
                {Array.from({ length: q.number }, (_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: i * 0.12,
                      type: 'spring',
                      stiffness: 300,
                      damping: 12,
                    }}
                  >
                    <Star
                      className="h-7 w-7 md:h-9 md:w-9"
                      style={{
                        color: '#fde047',
                        fill: '#fde047',
                        filter:
                          'drop-shadow(0 0 6px rgba(253,224,71,.8))',
                      }}
                    />
                  </motion.span>
                ))}

                <span className="battle-count-symbol font-tech ml-2 text-4xl font-black text-cyan-200 md:text-5xl">
                  =
                </span>

                <span
                  className="font-tech wiggle text-5xl font-black text-white md:text-6xl"
                  style={{
                    textShadow: '0 0 18px rgba(56,189,248,.8)',
                  }}
                >
                  ?
                </span>
              </div>
            ) : (
              <div
                className={`battle-prompt font-tech font-black tracking-wide text-white ${
                  q.prompt.length > 12
                    ? 'text-2xl md:text-4xl'
                    : 'text-4xl md:text-6xl'
                }`}
                style={{
                  textShadow: `0 0 24px ${level.color}`,
                  filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.4))',
                }}
              >
                {q.prompt}
              </div>
            )}

            <button
              onClick={() => speak(q.speech)}
              className="battle-listen mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-[10px] font-bold text-cyan-200 transition hover:bg-cyan-400/30 md:text-xs"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Dengarkan
            </button>
          </motion.div>

          {/* robots */}
          <div className="battle-robots absolute inset-x-0 bottom-0 flex items-end justify-between px-[4vw] pb-2 md:px-[8vw]">
            <RobotFigure
              ref={p1Ref}
              robot={robot1}
              size={
                mode === 2
                  ? 'clamp(80px, min(22vw, 28dvh), 300px)'
                  : 'clamp(90px, min(25vw, 32dvh), 340px)'
              }
              active={mode === 1 && turn === 'p1' && !done}
              state={stateFor('p1')}
              hp={hp.p1}
              down={downFor('p1')}
            />

            <RobotFigure
              ref={p2Ref}
              robot={robot2}
              mirrored
              size={
                mode === 2
                  ? 'clamp(80px, min(22vw, 28dvh), 300px)'
                  : 'clamp(90px, min(25vw, 32dvh), 340px)'
              }
              active={mode === 1 && turn === 'p2' && !done}
              state={stateFor('p2')}
              hp={hp.p2}
              down={downFor('p2')}
            />
          </div>

          {/* laser + fx overlay */}
          {shot && (
            <svg
              className="pointer-events-none absolute inset-0 z-30"
              width={shot.aw}
              height={shot.ah}
              viewBox={`0 0 ${shot.aw} ${shot.ah}`}
            >
              {phase === 'charge' && (
                <MuzzleCharge
                  key={`c${shot.key}`}
                  x={shot.sx}
                  y={shot.sy}
                  color={
                    shot.shooter === 'p1'
                      ? robot1.laser
                      : robot2.laser
                  }
                  dur={CHARGE_MS / 1000}
                />
              )}

              {phase === 'fire' && (
                <LaserShot
                  key={shot.key}
                  x1={shot.sx}
                  y1={shot.sy}
                  x2={shot.ex}
                  y2={shot.ey}
                  color={
                    shot.shooter === 'p1'
                      ? robot1.laser
                      : robot2.laser
                  }
                  travel={TRAVEL_MS / 1000}
                />
              )}
            </svg>
          )}

          {shot && phase === 'fire' && (
            <MuzzleFlash
              x={shot.sx}
              y={shot.sy}
              color={
                shot.shooter === 'p1'
                  ? robot1.laser
                  : robot2.laser
              }
            />
          )}

          {shot && phase === 'resolve' && shot.correct && (
            <Explosion
              key={shot.key}
              x={shot.ex}
              y={shot.ey}
            />
          )}

          {done &&
            done.winner !== 'none' &&
            done.winner !== 'draw' && (
              <Explosion
                big
                x={done.ex}
                y={done.ey}
              />
            )}

          {/* feedback banner */}
          <AnimatePresence>
            {banner && (
              <div
                key={banner.key}
                className="banner-pop absolute top-[38%] left-1/2 z-50 -translate-x-1/2 text-center"
              >
                <div
                  className="font-tech rounded-3xl border-b-8 px-8 py-3 text-2xl font-black tracking-wide md:px-12 md:text-5xl"
                  style={
                    banner.good
                      ? {
                          background:
                            'linear-gradient(135deg,#34d399,#059669)',
                          borderColor: '#065f46',
                          color: 'white',
                          boxShadow:
                            '0 0 50px rgba(52,211,153,.55)',
                          textShadow:
                            '0 3px 0 rgba(0,0,0,.35)',
                        }
                      : {
                          background:
                            'linear-gradient(135deg,#fbbf24,#ef4444)',
                          borderColor: '#7f1d1d',
                          color: 'white',
                          boxShadow:
                            '0 0 50px rgba(239,68,68,.5)',
                          textShadow:
                            '0 3px 0 rgba(0,0,0,.35)',
                        }
                  }
                >
                  {banner.text}
                </div>

                {banner.sub && (
                  <div className="mx-auto mt-2 w-max max-w-[90vw] rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold text-white md:text-lg">
                    {banner.sub}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ------- answers ------- */}
        {mode === 1 ? (
          <div className="battle-answers relative z-30 flex shrink-0 justify-center gap-2 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 sm:gap-3 md:gap-8 md:pb-7">
            {q.options.map((opt, i) => (
              <OptionBtn
                key={`${qIdx}-${i}`}
                opt={opt}
                i={i}
                big
                disabled={phase !== 'question' || !!done || (mode === 1 && turn !== 'p1')}
                isAnswer={
                  phase === 'resolve' &&
                  picked !== null &&
                  i === q.answer
                }
                isWrongPick={
                  phase === 'resolve' &&
                  picked?.side === 'p1' &&
                  picked.idx === i &&
                  picked.idx !== q.answer
                }
                showSpark={
                  phase !== 'question' &&
                  picked?.side === 'p1' &&
                  picked.idx === i
                }
                onPick={() => fire('p1', i)}
              />
            ))}
          </div>
        ) : (
          <div className="battle-answers relative z-30 flex shrink-0 flex-col gap-1 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 landscape:flex-row landscape:items-end landscape:justify-between landscape:gap-2 md:flex-row md:items-end md:justify-between md:gap-4 md:px-6 md:pb-4">
            <AnswerBank
              side="p1"
              label="PEMAIN 1"
              color="#38bdf8"
              options={q.options}
              disabled={phase !== 'question' || !!done}
              picked={picked}
              answer={q.answer}
              phase={phase}
              qIdx={qIdx}
              onPick={(i) => fire('p1', i)}
            />

            <AnswerBank
              side="p2"
              label="PEMAIN 2"
              color="#f472b6"
              options={q.options}
              disabled={phase !== 'question' || !!done}
              picked={picked}
              answer={q.answer}
              phase={phase}
              qIdx={qIdx}
              onPick={(i) => fire('p2', i)}
            />
          </div>
        )}
      </div>

      {/* creator credit */}
      <div className="pointer-events-none absolute top-3 left-3 z-40">
        <span className="rounded-full border border-white/30 bg-black/80 px-2.5 py-1 text-[9px] font-bold tracking-wide text-white md:text-[11px]">
          Created by:{' '}
          <span className="text-cyan-300">widodo</span> guru sd
        </span>
      </div>

      {/* top-right controls */}
      <div className="absolute top-3 right-3 z-40 flex gap-2">
        <IconBtn
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
          label={muted ? 'Nyalakan suara' : 'Bisukan'}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </IconBtn>

        <IconBtn
          onClick={() => {
            stopSpeak();
            sfx.click();
            onExit();
          }}
          label="Keluar"
        >
          <Home className="h-5 w-5" />
        </IconBtn>
      </div>

      {/* ------- result overlay ------- */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[3px]"
          >
            {done.stars >= 2 && (
              <StarRain count={done.stars === 3 ? 34 : 20} />
            )}

            <motion.div
              initial={{ scale: 0.4, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 130,
                damping: 15,
                delay: done.stars >= 1 ? 0.7 : 0.2,
              }}
              className="holo relative z-10 w-full max-w-lg rounded-[2rem] p-6 text-center md:p-9"
            >
              {mode === 1 ? (
                done.stars > 0 ? (
                  <>
                    <Trophy
                      className="mx-auto h-16 w-16 md:h-20 md:w-20"
                      style={{
                        color: '#fde047',
                        filter:
                          'drop-shadow(0 0 18px rgba(253,224,71,.8))',
                      }}
                    />

                    <h3 className="font-tech mt-3 bg-linear-to-b from-amber-200 to-orange-500 bg-clip-text text-4xl font-black text-transparent md:text-6xl">
                      KAMU MENANG!
                    </h3>

                    <p className="mt-1 text-base font-semibold text-slate-200 md:text-lg">
                      Robot lawan hancur! Benar {done.score1} dari{' '}
                      {TOTAL_QUESTIONS}
                    </p>

                    <div className="mt-3 flex justify-center gap-2">
                      {[1, 2, 3].map((n) => (
                        <motion.span
                          key={n}
                          initial={{
                            scale: 0,
                            rotate: -120,
                          }}
                          animate={{
                            scale: 1,
                            rotate: 0,
                          }}
                          transition={{
                            delay: 1.1 + n * 0.25,
                            type: 'spring',
                            stiffness: 260,
                            damping: 12,
                          }}
                        >
                          <Star
                            className="h-11 w-11 md:h-14 md:w-14"
                            style={{
                              color:
                                n <= done.stars
                                  ? '#fde047'
                                  : 'rgba(255,255,255,.2)',
                              fill:
                                n <= done.stars
                                  ? '#fde047'
                                  : 'none',
                              filter:
                                n <= done.stars
                                  ? 'drop-shadow(0 0 8px rgba(253,224,71,.9))'
                                  : 'none',
                            }}
                          />
                        </motion.span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Wrench className="mx-auto h-16 w-16 text-rose-400" />

                    <h3 className="font-tech mt-3 text-3xl font-black text-rose-300 md:text-5xl">
                      ROBOTMU RUSAK!
                    </h3>

                    <p className="mt-2 text-base font-semibold text-slate-200 md:text-lg">
                      Benar {done.score1} dari {TOTAL_QUESTIONS}. Ayo latihan lagi,
                      kamu pasti bisa!
                    </p>
                  </>
                )
              ) : done.winner === 'draw' ? (
                <>
                  <Crown className="mx-auto h-14 w-14 text-slate-300" />

                  <h3 className="font-tech mt-3 text-3xl font-black text-white md:text-5xl">
                    SERI!
                  </h3>

                  <p className="mt-2 text-lg font-bold text-slate-200">
                    PEMAIN 1 &nbsp;{done.score1} : {done.score2}&nbsp; PEMAIN 2
                  </p>
                </>
              ) : (
                <>
                  <Crown
                    className="mx-auto h-16 w-16"
                    style={{
                      color: '#fde047',
                      filter:
                        'drop-shadow(0 0 18px rgba(253,224,71,.8))',
                    }}
                  />

                  <h3
                    className="font-tech mt-3 text-3xl font-black md:text-5xl"
                    style={{
                      color:
                        done.winner === 'p1'
                          ? '#38bdf8'
                          : '#f472b6',
                    }}
                  >
                    {done.winner === 'p1'
                      ? 'PEMAIN 1'
                      : 'PEMAIN 2'}{' '}
                    MENANG!
                  </h3>

                  <img
                    src={
                      done.winner === 'p1'
                        ? robot1.img
                        : robot2.img
                    }
                    alt=""
                    className="blend-screen animate-floaty mx-auto mt-1 h-36 object-contain md:h-44"
                  />

                  <p className="text-lg font-bold text-slate-200">
                    PEMAIN 1 &nbsp;{done.score1} : {done.score2}&nbsp; PEMAIN 2
                  </p>
                </>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <ResultBtn
                  color="#38bdf8"
                  onClick={() => {
                    sfx.click();
                    onReplay();
                  }}
                >
                  <RotateCcw className="h-5 w-5" />
                  MAIN LAGI
                </ResultBtn>

                {mode === 1 && done.stars > 0 && onNext && (
                  <ResultBtn
                    color="#34d399"
                    onClick={() => {
                      sfx.click();
                      onNext();
                    }}
                  >
                    LEVEL {level.id + 1}
                    <ArrowRight className="h-5 w-5" />
                  </ResultBtn>
                )}

                <ResultBtn
                  color="#94a3b8"
                  onClick={() => {
                    sfx.click();
                    onExit();
                  }}
                >
                  <Home className="h-5 w-5" />
                  MENU
                </ResultBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- small bits ---------------- */
function PlayerChip({
  side,
  name,
  robot,
  hp,
  active,
  color,
  right,
  icon,
}: {
  side: string;
  name: string;
  robot: RobotDef;
  hp: number;
  active: boolean;
  color: string;
  right?: boolean;
  icon?: boolean;
}) {
  const filled = Math.ceil(hp / 20);

  return (
    <div
      className={`relative rounded-2xl border-2 bg-black/55 px-3 py-2 backdrop-blur-sm transition md:min-w-44 ${
        right ? 'text-right' : ''
      }`}
      style={{
        borderColor: active
          ? color
          : 'rgba(255,255,255,.18)',
        boxShadow: active
          ? `0 0 22px ${color}66`
          : 'none',
      }}
    >
      <div
        className={`flex items-center gap-2 ${
          right ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className="h-10 w-10 overflow-hidden rounded-xl"
          style={{
            background: `radial-gradient(circle, ${robot.glow}, #000 75%)`,
          }}
        >
          <img
            src={robot.img}
            alt={robot.name}
            className={`h-full w-full scale-125 object-contain object-top ${
              right ? '-scale-x-125' : ''
            }`}
            style={{
              filter: `drop-shadow(0 0 6px ${robot.glow})`,
            }}
          />
        </div>

        <div>
          <div
            className="flex items-center gap-1.5"
            style={{
              justifyContent: right
                ? 'flex-end'
                : 'flex-start',
            }}
          >
            {icon && (
              <Bot className="h-3.5 w-3.5 text-slate-300" />
            )}

            <span className="font-tech text-xs font-black tracking-widest text-white md:text-sm">
              {name}
            </span>

            <span
              className="font-tech rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold"
              style={{ color }}
            >
              {side}
            </span>
          </div>

          <div
            className={`mt-0.5 flex gap-0.5 ${
              right ? 'justify-end' : ''
            }`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Heart
                key={i}
                className="h-3.5 w-3.5 md:h-4 md:w-4"
                style={{
                  color:
                    i < filled
                      ? '#fb7185'
                      : 'rgba(255,255,255,.18)',
                  fill:
                    i < filled
                      ? '#fb7185'
                      : 'none',
                  filter:
                    i < filled
                      ? 'drop-shadow(0 0 3px rgba(251,113,133,.7))'
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white/25 bg-black/55 text-white transition hover:bg-black/85"
    >
      {children}
    </button>
  );
}

/* ---------------- answer option button ---------------- */
function OptionBtn({
  opt,
  i,
  big,
  disabled,
  isAnswer,
  isWrongPick,
  showSpark,
  onPick,
}: {
  opt: string;
  i: number;
  big?: boolean;
  disabled: boolean;
  isAnswer: boolean;
  isWrongPick: boolean;
  showSpark: boolean;
  onPick: () => void;
}) {
  const st = BTN_STYLES[i];

  return (
    <motion.button
      disabled={disabled}
      onClick={onPick}
      whileHover={
        disabled
          ? {}
          : {
              scale: 1.07,
              y: -4,
            }
      }
      whileTap={
        disabled
          ? {}
          : {
              scale: 0.9,
            }
      }
      animate={
        isWrongPick
          ? {
              x: [0, -9, 9, -7, 7, 0],
            }
          : isAnswer
            ? {
                scale: 1.08,
              }
            : {}
      }
      transition={
        isWrongPick
          ? {
              duration: 0.45,
            }
          : {
              type: 'spring',
              stiffness: 300,
            }
      }
      className={`reticle relative flex-1 cursor-pointer rounded-2xl border-b-[6px] bg-linear-to-br md:flex-none ${
        big
          ? 'min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 md:min-w-44 md:rounded-3xl md:border-b-8 md:px-8 md:py-5'
          : 'min-w-0 px-1.5 py-1.5 sm:px-2 sm:py-2 md:min-w-36 md:rounded-3xl md:border-b-8 md:px-5 md:py-4'
      } ${st.grad} ${
        disabled && !isAnswer ? 'opacity-50' : ''
      } ${
        isAnswer ? 'ring-4 ring-emerald-300' : ''
      } ${
        isWrongPick ? 'ring-4 ring-rose-400' : ''
      }`}
      style={{
        borderColor: st.border,
        boxShadow: isAnswer
          ? '0 0 34px rgba(52,211,153,.75)'
          : isWrongPick
            ? '0 0 34px rgba(251,113,133,.75)'
            : `0 6px 20px ${st.border}66`,
      }}
    >
      <span className="rc" />

      {showSpark && <SparkBurst color={st.spark} />}

      <span
        className={`font-black text-white ${
          big
            ? opt.length > 10
              ? 'font-display text-sm sm:text-lg md:text-2xl'
              : opt.length > 4
                ? 'font-display text-base uppercase sm:text-xl md:text-3xl'
                : 'font-tech text-2xl sm:text-4xl md:text-5xl'
            : opt.length > 10
              ? 'font-display text-xs sm:text-sm md:text-2xl'
              : opt.length > 4
                ? 'font-display text-sm uppercase sm:text-base md:text-2xl'
                : 'font-tech text-xl sm:text-2xl md:text-4xl'
        }`}
        style={{
          textShadow: '0 3px 0 rgba(0,0,0,.3)',
        }}
      >
        {opt}
      </span>
    </motion.button>
  );
}

/* ---------------- one player's bank of 3 options (2P realtime) ---------------- */
function AnswerBank({
  side,
  label,
  color,
  options,
  disabled,
  picked,
  answer,
  phase,
  qIdx,
  onPick,
}: {
  side: Side;
  label: string;
  color: string;
  options: string[];
  disabled: boolean;
  picked: { side: Side; idx: number } | null;
  answer: number;
  phase: Phase;
  qIdx: number;
  onPick: (i: number) => void;
}) {
  const claimedByMe = picked?.side === side;

  return (
    <div
      className={`battle-answer-bank rounded-2xl border-2 p-1.5 md:p-2 ${
        claimedByMe ? '' : 'opacity-95'
      }`}
      style={{
        borderColor: claimedByMe
          ? color
          : `${color}55`,
        background: 'rgba(4,8,18,.72)',
        boxShadow: claimedByMe
          ? `0 0 26px ${color}66`
          : 'none',
      }}
    >
      <div
        className="font-tech mb-1.5 text-center text-[10px] font-black tracking-[0.28em] md:text-xs"
        style={{ color }}
      >
        {label}
      </div>

      <div className="flex gap-1.5 md:gap-3">
        {options.map((opt, i) => (
          <OptionBtn
            key={`${qIdx}-${side}-${i}`}
            opt={opt}
            i={i}
            disabled={disabled}
            isAnswer={
              phase === 'resolve' &&
              picked !== null &&
              i === answer
            }
            isWrongPick={
              phase === 'resolve' &&
              claimedByMe &&
              picked!.idx === i &&
              picked!.idx !== answer
            }
            showSpark={
              phase !== 'question' &&
              claimedByMe &&
              picked!.idx === i
            }
            onPick={() => onPick(i)}
          />
        ))}
      </div>
    </div>
  );
}

function ResultBtn({
  children,
  onClick,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="font-tech flex cursor-pointer items-center gap-2 rounded-full border-b-4 px-5 py-2.5 text-sm font-black tracking-wider text-[#0b1120] transition hover:brightness-110 md:text-base"
      style={{
        background: color,
        borderColor: 'rgba(0,0,0,.35)',
        boxShadow: `0 0 22px ${color}55`,
      }}
    >
      {children}
    </button>
  );
}
