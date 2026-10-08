import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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

type Screen = 'title' | 'mode' | 'robots' | 'levels' | 'battle';

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

  // Path yang aman untuk GitHub Pages
  const BASE_URL = import.meta.env.BASE_URL;

  // Preload battlefield dan semua gambar robot
  useEffect(() => {
    const im = new Image();

    // FIX: jangan gunakan /bg/battlefield.jpg
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

        setScreen('levels');
      }, 550);
    } else if (next.length === 2) {
      window.setTimeout(() => {
        setP1(
          ROBOTS.find(
            (r) => r.id === next[0]
          )!
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
      ? LEVELS.find(
          (l) => l.id === level.id + 1
        )!
      : null;

  return (
    <div className="h-full">
      {screen === 'battle' &&
      p1 &&
      p2 &&
      level ? (
        <Battle
          key={battleKey}
          mode={mode}
          level={level}
          robot1={p1}
          robot2={p2}
          onExit={exitBattle}
          onReplay={() =>
            setBattleKey((k) => k + 1)
          }
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

          {/* Shared battlefield background */}
          <img
            src={`${BASE_URL}bg/battlefield.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-linear-to-b from-[#04060e]/85 via-[#04060e]/55 to-[#04060e]/90" />

          <Embers count={18} />

          {/* Global mute */}
          <button
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);

              if (muted) {
                sfx.click();
              }
            }}
            className="absolute top-5 right-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-white/25 bg-black/55 text-white transition hover:bg-black/85"
            title={
              muted
                ? 'Nyalakan suara'
                : 'Bisukan'
            }
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <Credit pos="bottom" />

          {screen === 'title' && (
            <TitleScreen
              onStart={() =>
                setScreen('mode')
              }
            />
          )}

          {screen === 'mode' && (
            <ModeScreen
              onPick={startMode}
              onBack={() =>
                setScreen('title')
              }
            />
          )}

          {screen === 'robots' && (
            <RobotSelect
              mode={mode}
              picked={picking}
              onPick={handleRobotPick}
              onBack={() =>
                setScreen('mode')
              }
            />
          )}

          {screen === 'levels' && (
            <LevelSelect
              stars={stars}
              onPick={startBattle}
              onBack={() => {
                setPicking([]);
                setScreen('robots');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
