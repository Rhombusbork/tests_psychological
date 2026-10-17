import { coreItems, fcInstinctItems, instinctItems, levelItems, validityItems } from '../items/index';
import type { EnneaType, LikertItem } from '../items/schema';
import { CONFIG } from './config';
import { rng, shuffle } from './rng';

/** 1단계 선별 문항: 측면마다 정문항 1 + 역문항 1, 일관성 쌍 원문항은 강제 포함 */
export function screeningItems(): LikertItem[] {
  const paired = new Set(validityItems.map((v) => v.pairWith).filter(Boolean));
  const pick = (i: LikertItem) => i.id.endsWith('-1') || i.key === -1 || paired.has(i.id);
  return [...coreItems.filter(pick), ...instinctItems.filter(pick)];
}

/** 1단계: 선별 문항 + 타당도(주의 문항 제외)를 제약 하에 섞고 주의 문항을 지정 구간에 삽입 */
export function buildPhase1(seed: number): string[] {
  const rand = rng(seed);
  const attention = validityItems.filter((i) => i.validity === 'attention');
  const pool: LikertItem[] = [...screeningItems(), ...validityItems.filter((i) => i.validity !== 'attention')];
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

/** 3단계 마무리: 본능 강제선택(쌍마다 2) + 1·2위 유형 수준 문항 */
export function buildFinal(top2: EnneaType[], seed: number): string[] {
  const rand = rng(seed + 2);
  const seen = new Map<string, number>();
  const inst = fcInstinctItems.filter((i) => {
    const k = `${i.a.instinct}-${i.b.instinct}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
    return seen.get(k)! <= 2;
  });
  return shuffle([...inst, ...levelItems.filter((i) => top2.includes(i.type!))], rand).map((i) => i.id);
}
