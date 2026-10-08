import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ROBOTS, type RobotDef } from '../game/data';
import { useTransparent } from '../game/transparency';
import { BackBtn } from './Menu';

/** Transparent robot artwork with a soft colour glow. */
function CardArt({ img, glow, name }: { img: string; glow: string; name: string }) {
  const src = useTransparent(img);
  return (
    <img
      src={src ?? img}
      alt={name}
      className={`mx-auto h-full object-contain transition duration-300 group-hover:scale-110 ${
        src ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ filter: `drop-shadow(0 8px 22px ${glow})` }}
    />
  );
}

export function RobotSelect({
  mode, picked, onPick, onBack,
}: {
  mode: 1 | 2;
  picked: string[];
  onPick: (robot: RobotDef) => void;
  onBack: () => void;
}) {
  const step = picked.length; // 0 = p1 choosing, 1 = p2 choosing
  const isP1 = step === 0;

  return (
    <div className="relative z-10 flex h-full flex-col items-center overflow-y-auto px-4 pt-16 pb-8 md:pt-20">
      <BackBtn onClick={onBack} />

      <motion.div
        key={step}
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="mb-2 text-center"
      >
        <h2
          className="font-tech text-3xl font-black tracking-wider text-white md:text-5xl"
          style={{ textShadow: `0 0 30px ${isP1 ? 'rgba(56,189,248,.7)' : 'rgba(244,114,182,.7)'}` }}
        >
          {mode === 1 ? 'PILIH ROBOTMU!' : isP1 ? 'PEMAIN 1, PILIH ROBOTMU!' : 'PEMAIN 2, PILIH ROBOTMU!'}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-300 md:text-base">
          Klik robot favoritmu untuk menuju arena
        </p>
      </motion.div>

      <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {ROBOTS.map((r, i) => {
          const takenBy = picked.indexOf(r.id); // -1 | 0 | 1
          const locked = takenBy !== -1;
          return (
            <motion.button
              key={r.id}
              initial={{ y: 60, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.06 * i, type: 'spring', stiffness: 130, damping: 15 }}
              whileHover={locked ? {} : { scale: 1.06, y: -8 }}
              whileTap={locked ? {} : { scale: 0.94 }}
              disabled={locked}
              onClick={() => onPick(r)}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border-3 p-3 pb-4 transition disabled:cursor-not-allowed"
              style={{
                borderColor: locked ? 'rgba(255,255,255,.15)' : `${r.color}88`,
                background: `radial-gradient(circle at 50% 30%, ${r.glow}, rgba(6,10,24,.96) 70%)`,
                boxShadow: locked ? 'none' : `0 10px 34px ${r.glow}`,
                opacity: locked ? 0.45 : 1,
              }}
            >
              {locked && (
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,.35)' }}
                >
                  <span
                    className="font-tech flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black"
                    style={{ background: takenBy === 0 ? '#38bdf8' : '#f472b6', color: '#0b1120' }}
                  >
                    <Check className="h-4 w-4" />
                    P{takenBy + 1}
                  </span>
                </div>
              )}

              <div className="relative h-36 md:h-44">
                <CardArt img={r.img} glow={r.glow} name={r.name} />
              </div>

              <div className="font-tech text-xl font-black tracking-wider md:text-2xl" style={{ color: r.color }}>
                {r.name}
              </div>
              <div className="text-xs font-semibold text-slate-300 md:text-sm">{r.title}</div>

              {/* decorative stats */}
              <div className="mx-auto mt-2 flex w-4/5 flex-col gap-1">
                {([['PWR', r.power], ['SPD', r.speed], ['DEF', r.armor]] as const).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="font-tech w-8 text-left text-[9px] font-bold text-slate-400">{k}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="h-1.5 w-3 rounded-full"
                          style={{ background: n <= v ? r.color : 'rgba(255,255,255,.14)' }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.button>
          );
        })}

        {/* filler card explaining */}
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="holo relative hidden flex-col items-center justify-center rounded-3xl p-4 text-center lg:flex"
        >
          <div className="font-tech text-lg font-black text-cyan-300">{mode} PEMAIN</div>
          <p className="mt-1 text-sm font-medium text-slate-300">
            {mode === 1
              ? 'Robot komputer akan menantangmu di arena!'
              : 'Bergantian menjawab — yang paling banyak benar menang!'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
