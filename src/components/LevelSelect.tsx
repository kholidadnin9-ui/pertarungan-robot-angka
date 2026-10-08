import { motion } from 'framer-motion';
import { Lock, Star, Swords } from 'lucide-react';
import { LEVELS, type LevelDef } from '../game/data';
import { sfx } from '../game/sound';
import { BackBtn } from './Menu';

export function LevelSelect({
  stars, onPick, onBack,
}: {
  stars: Record<number, number>;
  onPick: (level: LevelDef) => void;
  onBack: () => void;
}) {
  return (
    <div className="relative z-10 flex h-full flex-col items-center overflow-y-auto px-4 pt-16 pb-8 md:pt-20">
      <BackBtn onClick={onBack} />

      <motion.h2
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="font-tech mb-2 text-center text-3xl font-black tracking-wider text-white md:text-5xl"
        style={{ textShadow: '0 0 30px rgba(251,146,60,.65)' }}
      >
        PILIH LEVEL MISI
      </motion.h2>
      <p className="mb-8 text-center text-sm font-semibold text-slate-300 md:text-base">
        Setiap level punya 10 soal. Jawab minimal 6 benar untuk menang!
      </p>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {LEVELS.map((lv, i) => {
          const unlocked = lv.id === 1 || (stars[lv.id - 1] ?? 0) > 0;
          const earned = stars[lv.id] ?? 0;
          return (
            <motion.button
              key={lv.id}
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 120, damping: 16 }}
              whileHover={unlocked ? { scale: 1.05, rotate: -0.6 } : {}}
              whileTap={unlocked ? { scale: 0.95 } : {}}
              disabled={!unlocked}
              onClick={() => { sfx.pick(); onPick(lv); }}
              className="relative cursor-pointer overflow-hidden rounded-3xl border-3 p-5 text-left transition disabled:cursor-not-allowed"
              style={{
                borderColor: unlocked ? `${lv.color}88` : 'rgba(255,255,255,.14)',
                background: unlocked
                  ? `radial-gradient(circle at 20% 0%, ${lv.color}2e, rgba(6,10,24,.95) 64%)`
                  : 'rgba(10,14,26,.8)',
                boxShadow: unlocked ? `0 10px 34px ${lv.color}30` : 'none',
                filter: unlocked ? 'none' : 'grayscale(.7) brightness(.7)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-tech rounded-xl px-3 py-1.5 text-lg font-black tracking-wider"
                  style={{ background: unlocked ? lv.color : '#334155', color: '#0b1120' }}
                >
                  {lv.label}
                </span>
                {unlocked ? (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((n) => (
                      <Star
                        key={n}
                        className="h-6 w-6"
                        style={{
                          color: n <= earned ? '#fde047' : 'rgba(255,255,255,.22)',
                          fill: n <= earned ? '#fde047' : 'none',
                          filter: n <= earned ? 'drop-shadow(0 0 4px rgba(253,224,71,.8))' : 'none',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Lock className="h-7 w-7 text-slate-400" />
                )}
              </div>

              <div className="font-tech mt-4 text-2xl font-black text-white md:text-3xl">{lv.sub}</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Swords className="h-4 w-4" style={{ color: lv.color }} />
                10 soal &bull; Tembak laser robot!
              </div>

              {!unlocked && (
                <div className="absolute inset-0 flex items-end justify-center pb-4">
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-slate-300">
                    Selesaikan level {lv.id - 1} dulu ya
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}

        {/* total stars */}
        <motion.div
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="holo flex flex-col items-center justify-center rounded-3xl p-5 text-center"
        >
          <div className="font-tech text-lg font-black text-cyan-300">TOTAL BINTANG</div>
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-10 w-10" style={{ color: '#fde047', fill: '#fde047' }} />
            <span className="font-tech text-4xl font-black text-white">
              {Object.values(stars).reduce((a, b) => a + b, 0)}
            </span>
            <span className="font-tech text-xl text-slate-400">/ 15</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Kumpulkan semua bintang, Komandan!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
