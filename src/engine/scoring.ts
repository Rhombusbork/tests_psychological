import { coreItems, fcInstinctItems, fcTypeItems, instinctItems, levelItems } from '../items/index';
import { CENTERS, FACETS, type Center, type EnneaType, type ForcedChoiceItem, type Instinct, type LikertItem } from '../items/schema';
import { posterior } from './bayes';
import { CONFIG } from './config';

export type Answers = Readonly<Record<string, number>>;

export const TYPES: EnneaType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const INSTINCTS: Instinct[] = ['sp', 'so', 'sx'];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const scored = (i: LikertItem, a: Answers) => {
  const x = a[i.id];
  return x === undefined ? undefined : i.key === 1 ? x : 6 - x;
};

/** 문항 묶음 → 측면 평균의 평균 (1–5). 응답 없는 측면은 제외 */
function facetMean(items: LikertItem[], a: Answers): number {
  const byFacet = new Map<string, number[]>();
  for (const i of items) {
    const v = scored(i, a);
    if (v === undefined) continue;
    const arr = byFacet.get(i.facet!) ?? [];
    arr.push(v);
    byFacet.set(i.facet!, arr);
  }
  return mean([...byFacet.values()].map(mean));
}

/** 강제선택 응답(1–4) → A 기준 점수 +2/+1/−1/−2 */
const fcPoints = (x: number) => [0, 2, 1, -1, -2][x] ?? 0;

function fcScores<K extends string | number>(items: ForcedChoiceItem[], a: Answers, pick: (s: ForcedChoiceItem['a']) => K) {
  const sum = new Map<K, number>();
  const n = new Map<K, number>();
  for (const i of items) {
    const x = a[i.id];
    if (x === undefined) continue;
    const p = fcPoints(x);
    for (const [side, sign] of [[i.a, 1], [i.b, -1]] as const) {
      const k = pick(side);
      sum.set(k, (sum.get(k) ?? 0) + sign * p);
      n.set(k, (n.get(k) ?? 0) + 1);
    }
  }
  const out = new Map<K, number>();
  for (const [k, s] of sum) out.set(k, 50 + 50 * (s / (2 * n.get(k)!)));
  return out;
}

function combine<K extends string | number>(keys: K[], raw: Map<K, number>, fc: Map<K, number>) {
  const vals = keys.map((k) => raw.get(k)!);
  const m = mean(vals);
  const s = Math.max(sd(vals), CONFIG.sigmaFloor);
  const out = new Map<K, number>();
  for (const k of keys) {
    const L = clamp(50 + CONFIG.zScale * ((raw.get(k)! - m) / s), 0, 100);
    const F = fc.get(k);
    out.set(k, F === undefined ? L : CONFIG.likertWeight * L + CONFIG.fcWeight * F);
  }
  return out;
}

export interface TypeResult {
  type: EnneaType;
  raw: number;
  score: number;
  probability: number;
  facets: Record<string, number>;
}

export function scoreTypes(a: Answers): TypeResult[] {
  const raw = new Map(TYPES.map((t) => [t, facetMean(coreItems.filter((i) => i.type === t), a)] as const));
  const fc = fcScores(fcTypeItems, a, (s) => s.type!);
  const scores = combine(TYPES, raw, fc);
  const post = posterior(a);
  return TYPES.map((t, k) => ({
    type: t,
    raw: raw.get(t)!,
    score: scores.get(t)!,
    probability: post[k],
    facets: Object.fromEntries(
      FACETS.map((f) => [f, mean(coreItems.filter((i) => i.type === t && i.facet === f).map((i) => scored(i, a)).filter((v): v is number => v !== undefined))]),
    ),
  })).sort((x, y) => y.probability - x.probability || y.score - x.score);
}

export const neighbors = (t: EnneaType): [EnneaType, EnneaType] => [(((t + 7) % 9) + 1) as EnneaType, ((t % 9) + 1) as EnneaType];
export const centerOf = (t: EnneaType): Center => (Object.keys(CENTERS) as Center[]).find((c) => CENTERS[c].includes(t))!;

export interface FullResult {
  types: TypeResult[];
  main: EnneaType;
  confidence: number;
  lowConfidence: boolean;
  wing: { type: EnneaType; balanced: boolean; scores: Record<number, number> };
  tritype: EnneaType[];
  centers: Record<Center, number>;
  instincts: { instinct: Instinct; raw: number; score: number }[];
  stack: Instinct[];
  subtype: string;
  level: { value: number; band: 'healthy' | 'average' | 'stress'; healthy: number; stress: number } | null;
}

export function scoreAll(a: Answers): FullResult {
  const types = scoreTypes(a);
  const byType = new Map(types.map((r) => [r.type, r] as const));
  const main = types[0].type;

  const [w1, w2] = neighbors(main);
  const s1 = byType.get(w1)!.score;
  const s2 = byType.get(w2)!.score;
  const wing = { type: s1 >= s2 ? w1 : w2, balanced: Math.abs(s1 - s2) < CONFIG.balancedWingGap, scores: { [w1]: s1, [w2]: s2 } };

  const winners = (Object.keys(CENTERS) as Center[]).map((c) => types.find((r) => centerOf(r.type) === c)!);
  const tritype = [types[0], ...winners.filter((w) => w.type !== main).sort((x, y) => y.score - x.score)].map((r) => r.type);

  const centers = Object.fromEntries(
    (Object.keys(CENTERS) as Center[]).map((c) => [c, ((mean(CENTERS[c].map((t) => byType.get(t)!.raw)) - 1) / 4) * 100]),
  ) as Record<Center, number>;

  const instRaw = new Map(INSTINCTS.map((n) => [n, facetMean(instinctItems.filter((i) => i.instinct === n), a)] as const));
  const instScore = combine(INSTINCTS, instRaw, fcScores(fcInstinctItems, a, (s) => s.instinct!));
  const instincts = INSTINCTS.map((n) => ({ instinct: n, raw: instRaw.get(n)!, score: instScore.get(n)! })).sort((x, y) => y.score - x.score);
  const stack = instincts.map((i) => i.instinct);

  return {
    types,
    main,
    confidence: types[0].probability,
    lowConfidence: types[0].probability < CONFIG.lowConfidence,
    wing,
    tritype,
    centers,
    instincts,
    stack,
    subtype: `${stack[0]}${main}`,
    level: scoreLevel(main, a),
  };
}

export function scoreLevel(t: EnneaType, a: Answers): FullResult['level'] {
  const vals = (lv: 'healthy' | 'stress') =>
    levelItems.filter((i) => i.type === t && i.level === lv).map((i) => a[i.id]).filter((v): v is number => v !== undefined);
  const h = vals('healthy');
  const s = vals('stress');
  if (!h.length || !s.length) return null;
  const d = mean(h) - mean(s);
  const value = clamp(Math.round(5 - d), 1, 9);
  return { value, band: value <= 3 ? 'healthy' : value <= 6 ? 'average' : 'stress', healthy: mean(h), stress: mean(s) };
}
