import { coreItems, fcInstinctItems, fcTypeItems, instinctItems, levelItems, validityItems } from '../items/index';
import type { EnneaType, LikertItem } from '../items/schema';
import { CONFIG } from './config';
import { rng, shuffle } from './rng';

/** 1단계: 핵심 + 본능 + 타당도(주의 문항 제외)를 제약 하에 섞고 주의 문항을 지정 구간에 삽입 */
export function buildPhase1(seed: number): string[] {
  const rand = rng(seed);
  const attention = validityItems.filter((i) => i.validity === 'attention');
  const pool: LikertItem[] = [...coreItems, ...instinctItems, ...validityItems.filter((i) => i.validity !== 'attention')];
  const pairOf = new Map(validityItems.filter((v) => v.pairWith).map((v) => [v.id, v.pairWith!] as const));
  for (const [v, c] of [...pairOf]) pairOf.set(c, v);

  let best: LikertItem[] = [];
  for (let attempt = 0; attempt < CONFIG.order.retries; attempt++) {
    const strict = attempt < CONFIG.order.retries - 10;
    const remaining = shuffle(pool, rand);
    const out: LikertItem[] = [];
    const pos = new Map<string, number>();
    while (remaining.length) {
      const idx = remaining.findIndex((cand) => fits(cand, out, pos, pairOf, strict));
      const pick = remaining.splice(idx === -1 ? 0 : idx, 1)[0];
      pos.set(pick.id, out.length);
      out.push(pick);
    }
    best = out;
    if (violations(out, pairOf) === 0) break;
  }

  const ids = best.map((i) => i.id);
  attention.forEach((item, k) => {
    const [lo, hi] = CONFIG.order.attentionSlots[k % CONFIG.order.attentionSlots.length];
    const at = Math.floor(ids.length * (lo + rand() * (hi - lo)));
    ids.splice(at, 0, item.id);
  });
  return ids;
}

const typeOf = (i: LikertItem) => i.type ?? (i.validity === 'consistency' ? Number(i.pairWith![1]) : undefined);

function fits(
  cand: LikertItem,
  out: LikertItem[],
  pos: Map<string, number>,
  pairOf: Map<string, string>,
  strict: boolean,
): boolean {
  const t = typeOf(cand);
  const n = out.length;
  const run = CONFIG.order.maxSameTypeRun;
  if (t !== undefined && n >= run && out.slice(n - run).every((p) => typeOf(p) === t)) return false;
  const prev = out[n - 1];
  if (prev && prev.type === cand.type && prev.facet === cand.facet && cand.type !== undefined) return false;
  if (prev && prev.instinct && prev.instinct === cand.instinct && prev.facet === cand.facet) return false;
  if (strict) {
    const partner = pairOf.get(cand.id);
    if (partner && pos.has(partner) && n - pos.get(partner)! < CONFIG.order.consistencyMinDistance) return false;
  }
  return true;
}

function violations(out: LikertItem[], pairOf: Map<string, string>): number {
  let v = 0;
  const idx = new Map(out.map((i, k) => [i.id, k] as const));
  for (const [a, b] of pairOf) if (Math.abs(idx.get(a)! - idx.get(b)!) < CONFIG.order.consistencyMinDistance) v++;
  return v;
}

/** 2단계: 잠정 순위(내림차순 유형 배열)와 1·2위 점수 차로 변별 문항 선택 */
export function buildPhase2(ranking: EnneaType[], gap: number, seed: number): string[] {
  const rand = rng(seed + 1);
  const top = ranking.slice(0, CONFIG.phase2TopN);
  const pairs = new Set<string>();
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) pairs.add(key(top[i], top[j]));
  if (gap < CONFIG.phase2CloseGap) {
    for (const a of ranking.slice(0, 2)) for (const b of ranking.slice(4, 6)) pairs.add(key(a, b));
  }
  const types = fcTypeItems.filter((i) => pairs.has(key(i.a.type!, i.b.type!)));
  return shuffle([...types, ...fcInstinctItems], rand).map((i) => i.id);
}

/** 3단계: 확정 1·2위 유형의 수준 문항 */
export function buildPhase3(top2: EnneaType[], seed: number): string[] {
  const rand = rng(seed + 2);
  return shuffle(levelItems.filter((i) => top2.includes(i.type!)), rand).map((i) => i.id);
}

const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
