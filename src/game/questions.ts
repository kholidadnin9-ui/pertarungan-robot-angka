import { LevelDef, NUM_WORDS, TOTAL_QUESTIONS } from './data';

export type QKind = 'wordToNum' | 'numToWord' | 'count';

export interface Question {
  kind: QKind;
  number: number;         // target number
  prompt: string;         // big text shown
  hint: string;           // small label above prompt
  speech: string;         // text-to-speech string
  options: string[];      // 3 display options
  answer: number;         // index of correct option
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rangeNums(range: [number, number]): number[] {
  const out: number[] = [];
  for (let n = range[0]; n <= range[1]; n++) out.push(n);
  return out;
}

/** Pick 2 distractors: prefer close neighbours within the level range */
function distractors(answer: number, range: [number, number]): number[] {
  const pool = rangeNums(range).filter((n) => n !== answer);
  pool.sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer) || Math.random() - 0.5);
  return shuffle(pool.slice(0, 4)).slice(0, 2);
}

function makeQuestion(n: number, kind: QKind, range: [number, number]): Question {
  const [d1, d2] = distractors(n, range);

  if (kind === 'wordToNum') {
    const options = shuffle([n, d1, d2]).map(String);
    return {
      kind, number: n,
      prompt: NUM_WORDS[n].toUpperCase(),
      hint: 'Pilih LAMBANG bilangannya!',
      speech: `Pilih lambang bilangan dari ${NUM_WORDS[n]}`,
      options,
      answer: options.indexOf(String(n)),
    };
  }

  if (kind === 'count') {
    const options = shuffle([n, d1, d2]).map(String);
    return {
      kind, number: n,
      prompt: String(n),
      hint: 'Hitung bintangnya, lalu pilih angkanya!',
      speech: 'Hitung ada berapa bintang energi? Lalu pilih angkanya!',
      options,
      answer: options.indexOf(String(n)),
    };
  }

  // numToWord
  const optionsW = shuffle([n, d1, d2]).map((x) => NUM_WORDS[x]);
  return {
    kind: 'numToWord', number: n,
    prompt: String(n),
    hint: 'Pilih NAMA bilangannya!',
    speech: `Pilih nama bilangan dari angka ${n}`,
    options: optionsW,
    answer: optionsW.indexOf(NUM_WORDS[n]),
  };
}

/** Build exactly 10 questions for a level */
export function buildQuestions(level: LevelDef): Question[] {
  const nums = rangeNums(level.range);
  const kinds: QKind[] = ['wordToNum', 'numToWord'];

  // all unique (number, kind) combos
  let combos: { n: number; kind: QKind }[] = [];
  for (const n of nums) for (const k of kinds) combos.push({ n, kind: k });
  combos = shuffle(combos).slice(0, TOTAL_QUESTIONS);

  // sprinkle counting questions for young levels
  if (level.withCount) {
    const idxs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    for (const i of idxs) combos[i] = { n: combos[i].n, kind: 'count' };
  }

  return combos.map((c) => makeQuestion(c.n, c.kind, level.range));
}
