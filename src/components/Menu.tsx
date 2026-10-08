import { motion } from 'framer-motion';
import { Play, BookOpen, Zap, Trophy, User, Users, ChevronLeft } from 'lucide-react';
import { ROBOTS } from '../game/data';
import { sfx } from '../game/sound';
import { useTransparent } from '../game/transparency';

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const volt = ROBOTS[0];
  const ruby = ROBOTS[2];
  const voltSrc = useTransparent(volt.img);
  const rubySrc = useTransparent(ruby.img);
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10">
      {/* side robots */}
      <motion.img
        src={voltSrc ?? volt.img} alt={volt.name}
        style={{ filter: `drop-shadow(0 0 34px ${volt.glow}) drop-shadow(0 18px 26px rgba(0,0,0,.65))` }}
        className="pointer-events-none absolute bottom-[3vh] left-[1vw] w-[28vw] max-w-[330px] opacity-80 md:left-[2vw] md:w-[24vw] md:opacity-100"
        initial={{ x: -160, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, -14, 0] }}
        transition={{ x: { duration: 0.9, ease: 'easeOut' }, opacity: { duration: 0.9 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <motion.img
        src={rubySrc ?? ruby.img} alt={ruby.name}
        style={{ filter: `drop-shadow(0 0 34px ${ruby.glow}) drop-shadow(0 18px 26px rgba(0,0,0,.65))` }}
        className="pointer-events-none absolute right-[1vw] bottom-[3vh] w-[28vw] max-w-[330px] -scale-x-100 opacity-80 md:right-[2vw] md:w-[24vw] md:opacity-100"
        initial={{ x: 160, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, -14, 0] }}
        transition={{ x: { duration: 0.9, ease: 'easeOut', delay: 0.15 }, opacity: { duration: 0.9, delay: 0.15 }, y: { duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
      />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 14 }}
        className="flex flex-col items-center text-center"
      >
        <div className="font-tech mb-3 rounded-full border-2 border-cyan-400/60 bg-cyan-950/60 px-5 py-1.5 text-xs font-bold tracking-[0.35em] text-cyan-300 md:text-sm">
          BELAJAR BILANGAN 1 - 20
        </div>
        <h1
          className="title-glow font-tech text-[13vw] leading-none font-black tracking-tight md:text-[6.5rem]"
          style={{
            background: 'linear-gradient(180deg,#fef08a 0%,#fbbf24 38%,#f97316 70%,#ef4444 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            filter: 'drop-shadow(0 6px 0 rgba(120,30,0,.55))',
          }}
        >
          PERANG
        </h1>
        <h1
          className="title-glow font-tech -mt-1 text-[13vw] leading-none font-black tracking-tight md:text-[6.5rem]"
          style={{
            background: 'linear-gradient(180deg,#e0f2fe 0%,#38bdf8 45%,#6366f1 80%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            filter: 'drop-shadow(0 6px 0 rgba(10,30,90,.6))',
          }}
        >
          ROBOT ANGKA
        </h1>
        <p className="mt-4 max-w-md text-base font-medium text-sky-100/90 md:text-lg">
          Jawab soal bilangan, tembakkan laser, dan hancurkan robot lawan!
        </p>

        <motion.button
          onClick={() => { sfx.fanfare(); onStart(); }}
          className="pulse-btn font-tech mt-8 flex cursor-pointer items-center gap-3 rounded-full border-b-8 border-cyan-800 bg-linear-to-r from-cyan-400 via-sky-400 to-blue-500 px-12 py-5 text-2xl font-black tracking-widest text-[#062033] shadow-[0_0_50px_rgba(56,189,248,.45)] transition hover:brightness-110 md:text-3xl"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <Play className="h-8 w-8 fill-current" />
          MULAI BERMAIN
        </motion.button>

        {/* how to play strip */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-5"
        >
          {[
            { icon: BookOpen, label: 'Jawab Soal', c: '#4ade80' },
            { icon: Zap, label: 'Tembak Laser', c: '#fbbf24' },
            { icon: Trophy, label: 'Menangkan Duel', c: '#f472b6' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="holo flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <s.icon className="h-6 w-6" style={{ color: s.c }} />
                <span className="text-sm font-semibold md:text-base">{s.label}</span>
              </div>
              {i < 2 && <span className="text-2xl font-black text-cyan-400/70">→</span>}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function ModeScreen({ onPick, onBack }: { onPick: (mode: 1 | 2) => void; onBack: () => void }) {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-14">
      <BackBtn onClick={onBack} />
      <motion.h2
        initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="font-tech mb-6 text-center text-3xl font-black tracking-wider text-white md:mb-10 md:text-5xl"
        style={{ textShadow: '0 0 30px rgba(56,189,248,.6)' }}
      >
        PILIH MODE PERMAINAN
      </motion.h2>

      <div className="flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:items-stretch sm:gap-8 md:gap-10">
        <ModeCard
          delay={0.1}
          title="1 PEMAIN"
          desc="Lawan robot komputer!"
          color="#38bdf8"
          icon={<User className="h-8 w-8 md:h-10 md:w-10" />}
          img="/robots/steel.png"
          onClick={() => { sfx.pick(); onPick(1); }}
        />
        <ModeCard
          delay={0.22}
          title="2 PEMAIN"
          desc="Adu cepat jawab dengan teman!"
          color="#f472b6"
          icon={<Users className="h-8 w-8 md:h-10 md:w-10" />}
          img="/robots/ruby.png"
          onClick={() => { sfx.pick(); onPick(2); }}
        />
      </div>
    </div>
  );
}

function ModeCard({
  title, desc, color, icon, img, onClick, delay,
}: {
  title: string; desc: string; color: string; icon: React.ReactNode; img: string;
  onClick: () => void; delay: number;
}) {
  const src = useTransparent(img);
  return (
    <motion.button
      initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.04, rotate: -1 }} whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative w-[min(88vw,19rem)] shrink-0 cursor-pointer overflow-hidden rounded-3xl border-b-8 p-4 text-center sm:w-72 md:w-80 md:p-5"
      style={{
        background: `radial-gradient(circle at 50% 22%, ${color}22, rgba(5,8,20,.95) 72%)`,
        borderColor: color,
        boxShadow: `0 0 40px ${color}33`,
      }}
    >
      {/* full robot, never cropped */}
      <div className="relative mx-auto flex h-44 items-end justify-center md:h-56">
        <div
          className="absolute bottom-0 h-3 w-3/5 rounded-[100%] blur-md"
          style={{ background: `radial-gradient(ellipse, ${color}88, transparent 70%)` }}
        />
        <img
          src={src ?? img} alt=""
          className={`h-full w-auto max-w-full object-contain transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.06] ${
            src ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ filter: `drop-shadow(0 0 26px ${color}55)` }}
        />
      </div>
      <div className="relative mt-2 flex flex-col items-center gap-1.5" style={{ color }}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-tech text-2xl font-black tracking-widest text-white md:text-3xl">{title}</span>
        </div>
        <span className="text-sm font-semibold text-slate-200 md:text-base">{desc}</span>
      </div>
    </motion.button>
  );
}

/** Small high-contrast creator credit. */
export function Credit({ pos = 'bottom' }: { pos?: 'bottom' | 'corner' }) {
  return (
    <div
      className={`pointer-events-none fixed z-[70] ${
        pos === 'bottom'
          ? 'bottom-1.5 left-1/2 -translate-x-1/2'
          : 'top-3 left-3'
      }`}
    >
      <span
        className="rounded-full border border-white/30 bg-black/80 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-[0_2px_10px_rgba(0,0,0,.6)] md:text-xs"
      >
        Created by: <span className="text-cyan-300">widodo</span> guru sd
      </span>
    </div>
  );
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => { sfx.click(); onClick(); }}
      className="absolute top-5 left-5 z-30 flex cursor-pointer items-center gap-1 rounded-full border-2 border-white/25 bg-black/50 px-4 py-2 text-sm font-bold text-white transition hover:bg-black/80 md:text-base"
    >
      <ChevronLeft className="h-5 w-5" /> Kembali
    </button>
  );
}
