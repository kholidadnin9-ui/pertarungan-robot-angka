export interface RobotDef {
  id: string;
  name: string;
  title: string;
  img: string;
  color: string;   // main hex for UI accents
  laser: string;   // laser beam hex
  glow: string;    // rgba glow
  power: number;   // 1-5 decorative stats
  speed: number;
  armor: number;
  /** muzzle position of the arm cannon, as a fraction of the artwork box */
  muzzle: { x: number; y: number };
}

export const ROBOTS: RobotDef[] = [
  {
    id: 'volt', name: 'VOLT', title: 'Si Petir Kuning', img: '/robots/volt.png',
    color: '#facc15', laser: '#fde047', glow: 'rgba(250,204,21,.45)',
    power: 4, speed: 5, armor: 3, muzzle: { x: 0.925, y: 0.255 },
  },
  {
    id: 'aurex', name: 'AUREX', title: 'Raja Emas', img: '/robots/aurex.png',
    color: '#d4a017', laser: '#fbbf24', glow: 'rgba(212,160,23,.5)',
    power: 5, speed: 3, armor: 4, muzzle: { x: 0.925, y: 0.255 },
  },
  {
    id: 'ruby', name: 'RUBY', title: 'Ratu Laser Pink', img: '/robots/ruby.png',
    color: '#f472b6', laser: '#f9a8d4', glow: 'rgba(244,114,182,.45)',
    power: 3, speed: 5, armor: 3, muzzle: { x: 0.925, y: 0.255 },
  },
  {
    id: 'frost', name: 'FROST', title: 'Kesatria Salju', img: '/robots/frost.png',
    color: '#e2e8f0', laser: '#7dd3fc', glow: 'rgba(226,232,240,.4)',
    power: 3, speed: 4, armor: 4, muzzle: { x: 0.925, y: 0.26 },
  },
  {
    id: 'lumin', name: 'LUMIN', title: 'Pangeran Cahaya', img: '/robots/lumin.png',
    color: '#f5e7c6', laser: '#fef08a', glow: 'rgba(245,231,198,.45)',
    power: 4, speed: 4, armor: 4, muzzle: { x: 0.925, y: 0.255 },
  },
  {
    id: 'steel', name: 'STEEL', title: 'Baja Perkasa', img: '/robots/steel.png',
    color: '#94a3b8', laser: '#a5f3fc', glow: 'rgba(148,163,184,.45)',
    power: 4, speed: 3, armor: 5, muzzle: { x: 0.925, y: 0.26 },
  },
];

/* Indonesian number words for 1-20 (index = number) */
export const NUM_WORDS: string[] = [
  '', 'satu', 'dua', 'tiga', 'empat', 'lima',
  'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh',
  'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
  'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas', 'dua puluh',
];

export interface LevelDef {
  id: number;
  label: string;
  sub: string;
  range: [number, number];
  color: string;
  withCount: boolean; // include "count the stars" questions
}

export const LEVELS: LevelDef[] = [
  { id: 1, label: 'LEVEL 1', sub: 'Angka 1 – 5', range: [1, 5], color: '#4ade80', withCount: true },
  { id: 2, label: 'LEVEL 2', sub: 'Angka 6 – 10', range: [6, 10], color: '#38bdf8', withCount: true },
  { id: 3, label: 'LEVEL 3', sub: 'Angka 11 – 15', range: [11, 15], color: '#a78bfa', withCount: false },
  { id: 4, label: 'LEVEL 4', sub: 'Angka 16 – 20', range: [16, 20], color: '#fb923c', withCount: false },
  { id: 5, label: 'LEVEL 5', sub: 'Semua Angka 1 – 20', range: [1, 20], color: '#f43f5e', withCount: false },
];

export const TOTAL_QUESTIONS = 10;
export const MAX_HP = 100;

export const PRAISES = [
  'LUAR BIASA!', 'HEBAT SEKALI!', 'KAMU PINTAR!', 'TEMBAKAN TEPAT!',
  'KEREN!', 'ROBOT SUPER!', 'MANTAP!',
];

export const OOPS = [
  'UPS! Coba lagi ya!', 'BELUM TEPAT!', 'Hampir benar!', 'Ayo semangat!',
];
