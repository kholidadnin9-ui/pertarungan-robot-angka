
import { useEffect, useState } from 'react';
import { Volume2, VolumeX, Bot, Clock3, ArrowLeft } from 'lucide-react';
import { Battle } from './components/Battle';
import { Embers } from './components/Effects';
import { LevelSelect } from './components/LevelSelect';
import { Credit, ModeScreen, TitleScreen } from './components/Menu';
import { RobotSelect } from './components/RobotSelect';
import {
  LEVELS,
  ROBOTS,
  type LevelDef,
  type RobotDef,
} from './game/data';
import { isMuted, setMuted, sfx } from './game/sound';
import { preloadTransparent } from './game/transparency';

type Screen =
  | 'title'
  | 'mode'
  | 'robots'
  | 'computerTime'
  | 'levels'
  | 'battle';

type ComputerThinkTime = 5 | 10 | 15;

function loadStars(): Record<number, number> {
  try {
    return JSON.parse(
      localStorage.getItem('robot-angka-stars') || '{}'
    );
  } catch {
    return {};
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [mode, setMode] = useState<1 | 2>(1);
  const [p1, setP1] = useState<RobotDef | null>(null);
  const [p2, setP2] = useState<RobotDef | null>(null);
  const [picking, setPicking] = useState<string[]>([]);
  const [level, setLevel] = useState<LevelDef | null>(null);
  const [stars, setStars] =
    useState<Record<number, number>>(loadStars);
  const [battleKey, setBattleKey] = useState(0);
  const [muted, setMutedState] = useState(isMuted());

  // Waktu berpikir komputer: 5, 10, atau 15 detik.
  const [computerThinkTime, setComputerThinkTime] =
    useState<ComputerThinkTime>(10);

  // Path yang aman untuk GitHub Pages.
  const BASE_URL = import.meta.env.BASE_URL;

  useEffect(() => {
    const im = new Image();
    im.src = `${BASE_URL}bg/battlefield.jpg`;

    preloadTransparent(ROBOTS.map((r) => r.img));
  }, [BASE_URL]);

  function saveStars(lv: number, n: number) {
    setStars((prev) => {
      const next = {
        ...prev,
        [lv]: Math.max(prev[lv] ?? 0, n),
      };

      localStorage.setItem(
        'robot-angka-stars',
        JSON.stringify(next)
      );

      return next;
    });
  }

  function handleRobotPick(robot: RobotDef) {
    const already =
      mode === 1
        ? picking.length >= 1
        : picking.length >= 2;

    if (already || picking.includes(robot.id)) return;

    sfx.pick();

    const next = [...picking, robot.id];
    setPicking(next);

    if (mode === 1) {
      window.setTimeout(() => {
        setP1(robot);

        const foes = ROBOTS.filter(
          (r) => r.id !== robot.id
        );

        setP2(
          foes[Math.floor(Math.random() * foes.length)]
        );

        // Pemain memilih waktu berpikir komputer terlebih dahulu.
        setScreen('computerTime');
      }, 550);
    } else if (next.length === 2) {
      window.setTimeout(() => {
        setP1(
          ROBOTS.find((r) => r.id === next[0])!
        );

        setP2(robot);
        setScreen('levels');
      }, 550);
    }
  }

  function startBattle(lv: LevelDef) {
    setLevel(lv);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  }

  function exitBattle() {
    setScreen('levels');
  }

  function startMode(m: 1 | 2) {
    setMode(m);
    setPicking([]);
    setP1(null);
    setP2(null);
    setScreen('robots');
  }

  const nextLevel =
    level && level.id < 5
      ? LEVELS.find((l) => l.id === level.id + 1)!
      : null;

  return (
    <div className="h-full">
      {screen === 'battle' && p1 && p2 && level ? (
        <Battle
          key={battleKey}
          mode={mode}
          level={level}
          robot1={p1}
          robot2={p2}
          computerThinkTime={computerThinkTime}
          onExit={exitBattle}
          onReplay={() => setBattleKey((k) => k + 1)}
          onNext={
            nextLevel
              ? () => startBattle(nextLevel)
              : null
          }
          onStars={(n) => {
            if (mode === 1) {
              saveStars(level.id, n);
            }
          }}
        />
      ) : (
        <div className="fixed inset-0 overflow-hidden bg-[#05070f]">
          <img
            src={`${BASE_URL}bg/battlefield.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-linear-to-b from-[#04060e]/85 via-[#04060e]/55 to-[#04060e]/90" />

          <Embers count={18} />

          {/* Tombol suara */}
          <button
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);

              if (muted) sfx.click();
            }}
            className="absolute top-5 right-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-white/25 bg-black/55 text-white transition hover:bg-black/85"
            title={muted ? 'Nyalakan suara' : 'Bisukan'}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <Credit pos="bottom" />

          {screen === 'title' && (
            <TitleScreen onStart={() => setScreen('mode')} />
          )}

          {screen === 'mode' && (
            <ModeScreen
              onPick={startMode}
              onBack={() => setScreen('title')}
            />
          )}

          {screen === 'robots' && (
            <RobotSelect
              mode={mode}
              picked={picking}
              onPick={handleRobotPick}
              onBack={() => setScreen('mode')}
            />
          )}

          {/* Pilihan durasi komputer khusus mode 1 pemain */}
          {screen === 'computerTime' && (
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
              <div className="w-full max-w-xl rounded-3xl border border-cyan-300/40 bg-slate-950/90 p-5 text-center shadow-2xl backdrop-blur-md sm:p-8">
                <Bot className="mx-auto h-14 w-14 text-cyan-300 sm:h-16 sm:w-16" />

                <h2 className="mt-3 text-2xl font-black tracking-wide text-white sm:text-4xl">
                  WAKTU BERPIKIR KOMPUTER
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm text-slate-300 sm:text-base">
                  Berapa lama robot komputer boleh berpikir
                  sebelum menjawab soal?
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {([5, 10, 15] as const).map((seconds) => {
                    const selected = computerThinkTime === seconds;

                    return (
                      <button
                        key={seconds}
                        onClick={() => {
                          setComputerThinkTime(seconds);
                          sfx.click();
                        }}
                        className={`rounded-2xl border-2 px-2 py-4 transition hover:scale-105 sm:py-5 ${
                          selected
                            ? 'border-yellow-300 bg-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.25)]'
                            : 'border-white/20 bg-white/5 hover:border-cyan-300/70'
                        }`}
                      >
                        <Clock3
                          className={`mx-auto h-6 w-6 sm:h-8 sm:w-8 ${
                            selected ? 'text-yellow-300' : 'text-cyan-300'
                          }`}
                        />

                        <div className="mt-2 text-2xl font-black text-white sm:text-4xl">
                          {seconds}
                        </div>

                        <div className="text-xs font-bold tracking-wider text-slate-300 sm:text-sm">
                          DETIK
                        </div>

                        {selected && (
                          <div className="mt-2 text-xs font-black text-yellow-300">
                            DIPILIH
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                  <button
                    onClick={() => setScreen('robots')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-bold text-white transition hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    KEMBALI
                  </button>

                  <button
                    onClick={() => {
                      sfx.click();
                      setScreen('levels');
                    }}
                    className="rounded-xl border-b-4 border-emerald-800 bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:brightness-110"
                  >
                    LANJUT PILIH LEVEL →
                  </button>
                </div>
              </div>
            </div>
          )}

          {screen === 'levels' && (
            <LevelSelect
              stars={stars}
              onPick={startBattle}
              onBack={() => {
                setPicking([]);
                setScreen(mode === 1 ? 'computerTime' : 'robots');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
