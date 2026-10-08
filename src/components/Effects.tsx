import { useMemo } from 'react';
import { motion } from 'framer-motion';

/* ================================================================
   LASER: charge-up at the muzzle + travelling bolt + beam + impact
   ================================================================ */

/** Energy gathering in the cannon barrel right before the shot. */
export function MuzzleCharge({
  x, y, color, dur = 0.36,
}: { x: number; y: number; color: string; dur?: number }) {
  return (
    <g>
      {/* growing energy orb */}
      <motion.circle
        cx={x} cy={y} fill={color}
        initial={{ r: 2, opacity: 0 }}
        animate={{ r: [2, 15, 11], opacity: [0, 0.95, 1] }}
        transition={{ duration: dur, ease: 'easeOut' }}
        style={{ filter: `blur(3px) drop-shadow(0 0 14px ${color})` }}
      />
      <motion.circle
        cx={x} cy={y} fill="#ffffff"
        initial={{ r: 0, opacity: 0 }}
        animate={{ r: [0, 6, 4.5], opacity: [0, 1, 1] }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />
      {/* two spinning charge rings */}
      {[0, 1].map((i) => (
        <motion.ellipse
          key={i}
          cx={x} cy={y} fill="none"
          stroke={i === 0 ? '#ffffff' : color}
          strokeWidth={1.6}
          initial={{ rx: 3, ry: 3, opacity: 0, rotate: 0 }}
          animate={{ rx: [3, 24], ry: [3, 24], opacity: [0, 0.85, 0], rotate: i ? 120 : -150 }}
          transition={{ duration: dur, ease: 'easeOut' }}
          style={{ transformOrigin: `${x}px ${y}px`, filter: `drop-shadow(0 0 6px ${color})` }}
        />
      ))}
      {/* inward suction sparks */}
      {Array.from({ length: 6 }, (_, i) => {
        const ang = (i / 6) * Math.PI * 2 + 0.4;
        const R = 46;
        return (
          <motion.circle
            key={`s${i}`}
            cx={x + Math.cos(ang) * R}
            cy={y + Math.sin(ang) * R}
            r={2.4} fill="#fff"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: -Math.cos(ang) * R,
              y: -Math.sin(ang) * R,
            }}
            transition={{ duration: dur * 0.9, ease: 'easeIn', delay: i * 0.02 }}
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        );
      })}
    </g>
  );
}

/** The laser shot itself: bright bolt + trail + wide glow + impact flare. */
export function LaserShot({
  x1, y1, x2, y2, color, travel = 0.3,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; travel?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  void len;
  const TAIL = Math.min(150, len * 0.45);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <g>
      {/* --- wide soft beam that lingers and fades --- */}
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={26} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.5 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.5, 0.42, 0] }}
        transition={{
          pathLength: { duration: travel, ease: 'easeOut' },
          opacity: { duration: travel + 0.5, times: [0, 0.35, 1] },
        }}
        style={{ filter: `blur(11px)` }}
      />
      {/* --- hot core beam --- */}
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#ffffff" strokeWidth={7.5} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{
          pathLength: { duration: travel, ease: 'easeOut' },
          opacity: { duration: travel + 0.42, times: [0, 0.3, 1] },
        }}
        style={{ filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 26px ${color})` }}
      />
      {/* --- coloured halo beam --- */}
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={14} strokeLinecap="round" opacity={0.7}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.7, 0.7, 0] }}
        transition={{
          pathLength: { duration: travel, ease: 'easeOut' },
          opacity: { duration: travel + 0.45, times: [0, 0.3, 1] },
        }}
        style={{ filter: 'blur(2px)' }}
      />

      {/* --- travelling energy bolt with a tapered tail --- */}
      <motion.g
        initial={{ x: x1, y: y1 }}
        animate={{ x: x2, y: y2 }}
        transition={{ duration: travel, ease: 'easeOut' }}
      >
        <g transform={`rotate(${angle})`}>
          {/* tail glow */}
          <line
            x1={-TAIL} y1={0} x2={0} y2={0}
            stroke={color} strokeWidth={20} strokeLinecap="round" opacity={0.55}
            style={{ filter: 'blur(9px)' }}
          />
          <line
            x1={-TAIL * 0.8} y1={0} x2={0} y2={0}
            stroke="#ffffff" strokeWidth={9} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
          {/* bolt head */}
          <circle cx={0} cy={0} r={13} fill={color} opacity={0.6} style={{ filter: 'blur(6px)' }} />
          <circle cx={0} cy={0} r={7} fill="#ffffff" />
          {/* wing sparks */}
          <line x1={-8} y1={-11} x2={4} y2={-4} stroke={color} strokeWidth={3} strokeLinecap="round" />
          <line x1={-8} y1={11} x2={4} y2={4} stroke={color} strokeWidth={3} strokeLinecap="round" />
        </g>
      </motion.g>

      {/* --- muzzle burst --- */}
      <motion.circle
        cx={x1} cy={y1} fill="#ffffff"
        initial={{ r: 6, opacity: 1 }}
        animate={{ r: [6, 30, 8], opacity: [1, 0.9, 0] }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 18px ${color})` }}
      />
      <motion.circle
        cx={x1} cy={y1} fill={color}
        initial={{ r: 4, opacity: 0.9 }}
        animate={{ r: [4, 52, 14], opacity: [0.9, 0.5, 0] }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ filter: 'blur(8px)' }}
      />

      {/* --- impact flare --- */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: travel + 0.5, times: [0, 0.85, 0.92, 1] }}
      >
        <circle
          cx={x2} cy={y2} r={22} fill="#fff"
          style={{ filter: `drop-shadow(0 0 24px ${color})` }}
        />
        <circle cx={x2} cy={y2} r={44} fill={color} opacity={0.5} style={{ filter: 'blur(14px)' }} />
        {/* radial splash spikes */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          const R = 40;
          return (
            <line
              key={i}
              x1={x2 + Math.cos(a) * 8} y1={y2 + Math.sin(a) * 8}
              x2={x2 + Math.cos(a) * R} y2={y2 + Math.sin(a) * R}
              stroke={i % 2 ? '#ffffff' : color} strokeWidth={3} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          );
        })}
      </motion.g>
    </g>
  );
}

/* ---------------- Muzzle flash ---------------- */
export function MuzzleFlash({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div
      className="flash-out pointer-events-none absolute z-40"
      style={{
        left: x - 42, top: y - 42, width: 84, height: 84,
        background: `radial-gradient(circle, #fff 0%, ${color} 34%, rgba(255,180,40,.55) 56%, transparent 72%)`,
        borderRadius: '50%',
        clipPath: 'polygon(50% 0%,61% 36%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 36%)',
      }}
    />
  );
}

/* ---------------- Fiery explosion ---------------- */
const FIRE_COLORS = ['#fde047', '#fb923c', '#f97316', '#ef4444', '#fbbf24', '#fca5a5'];

export function Explosion({ x, y, big = false }: { x: number; y: number; big?: boolean }) {
  const parts = useMemo(() => {
    const n = big ? 26 : 16;
    return Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const dist = (big ? 150 : 95) + Math.random() * (big ? 130 : 80);
      return {
        id: i,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist,
        size: 8 + Math.random() * 16,
        color: FIRE_COLORS[i % FIRE_COLORS.length],
        rot: Math.random() * 540 - 270,
        dur: 0.7 + Math.random() * 0.5,
      };
    });
  }, [big]);

  const smokes = useMemo(
    () =>
      Array.from({ length: big ? 8 : 5 }, (_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 90,
        delay: 0.25 + Math.random() * 0.5,
        size: 26 + Math.random() * 30,
      })),
    [big],
  );

  const scale = big ? 1.8 : 1;

  return (
    <div className="pointer-events-none absolute z-40" style={{ left: x, top: y }}>
      {/* core flash */}
      <div
        className="flash-out absolute"
        style={{
          left: -70 * scale, top: -70 * scale, width: 140 * scale, height: 140 * scale,
          background: 'radial-gradient(circle, #fff 0%, #fde047 26%, #fb923c 48%, #ef4444 66%, transparent 78%)',
          borderRadius: '50%',
        }}
      />
      {/* shockwave rings */}
      <div
        className="ring-out absolute rounded-full border-8"
        style={{
          left: -60 * scale, top: -60 * scale, width: 120 * scale, height: 120 * scale,
          borderColor: 'rgba(251,146,60,.8)',
        }}
      />
      <div
        className="ring-out absolute rounded-full border-4"
        style={{
          left: -60 * scale, top: -60 * scale, width: 120 * scale, height: 120 * scale,
          borderColor: 'rgba(253,224,71,.9)', animationDelay: '0.12s',
        }}
      />
      {/* fire particles */}
      {parts.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2,
            background: `radial-gradient(circle, #fff 0%, ${p.color} 55%, transparent 75%)`,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, rotate: p.rot, scale: 0.25 }}
          transition={{ duration: p.dur, ease: 'easeOut' }}
        />
      ))}
      {/* smoke */}
      {smokes.map((s) => (
        <span
          key={s.id}
          className="smoke-up absolute rounded-full"
          style={{
            left: s.dx - s.size / 2, top: -s.size / 2,
            width: s.size, height: s.size,
            background: 'radial-gradient(circle, rgba(90,90,90,.85) 0%, rgba(40,40,40,.5) 60%, transparent 75%)',
            animationDelay: `${s.delay}s`, opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- High-voltage electric shock ---------------- */
function jagPoints(x1: number, y1: number, x2: number, y2: number, segs: number): string {
  const pts: string[] = [`${x1},${y1}`];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 54;
    const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
    pts.push(`${nx},${ny}`);
  }
  pts.push(`${x2},${y2}`);
  return pts.join(' ');
}

export function ElectricShock() {
  const paths = useMemo(() => {
    const mk = () => {
      const f = jagPoints(15 + Math.random() * 70, -6, 10 + Math.random() * 80, 106, 9);
      const b = jagPoints(50, 30, Math.random() > 0.5 ? 104 : -4, 40 + Math.random() * 30, 5);
      return { f, b };
    };
    return [mk(), mk(), mk()];
  }, []);

  return (
    <div className="lightning-flick pointer-events-none absolute inset-0 z-30">
      <svg
        width="100%" height="100%" viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        {paths.map((p, i) => (
          <g key={i} opacity={1 - i * 0.22}>
            <polyline points={p.f} fill="none" stroke="#ffffff" strokeWidth={1.8}
              style={{ filter: 'drop-shadow(0 0 4px #22d3ee)' }} />
            <polyline points={p.f} fill="none" stroke="#22d3ee" strokeWidth={4.4} opacity={0.5}
              style={{ filter: 'blur(2px)' }} />
            <polyline points={p.b} fill="none" stroke="#a5f3fc" strokeWidth={1.1}
              style={{ filter: 'drop-shadow(0 0 3px #22d3ee)' }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------------- Ambient floating embers ---------------- */
export function Embers({ count = 16 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 6,
        dur: 7 + Math.random() * 9,
        delay: Math.random() * 10,
        dx: (Math.random() - 0.5) * 120,
        color: i % 3 === 0 ? '#fb923c' : i % 3 === 1 ? '#fbbf24' : '#38bdf8',
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size, height: e.size,
            background: e.color,
            boxShadow: `0 0 ${e.size * 2}px ${e.color}`,
            animationDuration: `${e.dur}s`,
            animationDelay: `${e.delay}s`,
            ['--dx' as string]: `${e.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- Victory star rain ---------------- */
const STAR_COLORS = ['#fde047', '#fbbf24', '#38bdf8', '#f472b6', '#4ade80', '#a78bfa'];

export function StarRain({ count = 26 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 12 + Math.random() * 18,
        dur: 2.6 + Math.random() * 2.4,
        delay: Math.random() * 2.2,
        color: STAR_COLORS[i % STAR_COLORS.length],
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {items.map((s) => (
        <svg
          key={s.id}
          className="star-fall"
          width={s.size} height={s.size} viewBox="0 0 24 24"
          style={{
            left: `${s.left}%`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            filter: `drop-shadow(0 0 6px ${s.color})`,
          }}
        >
          <path
            fill={s.color}
            d="M12 2l2.94 6.34 6.94.76-5.16 4.7 1.4 6.83L12 17.27 5.88 20.63l1.4-6.83-5.16-4.7 6.94-.76L12 2z"
          />
        </svg>
      ))}
    </div>
  );
}

/* ---------------- Tiny spark burst (button feedback) ---------------- */
export function SparkBurst({ color }: { color: string }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return { id: i, dx: Math.cos(ang) * 42, dy: Math.sin(ang) * 42 };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {parts.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-2 w-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
