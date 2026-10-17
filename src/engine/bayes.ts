import { itemById, type AnyItem } from '../items/index';
import type { EnneaType } from '../items/schema';
import { CONFIG } from './config';
import type { Answers } from './scoring';

const TYPES: EnneaType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const B = CONFIG.bayes;

const isWing = (k: number, t: number) => Math.abs(k - t) === 1 || Math.abs(k - t) === 8;
const mu = (itemType: number, t: number) => (itemType === t ? B.muSelf : isWing(itemType, t) ? B.muWing : B.muOther);
const logNormal = (x: number, m: number) => -((x - m) ** 2) / (2 * B.sigma ** 2);

/** 이 문항이 유형 판정에 쓰이는가 (유형 핵심 리커트 / 유형 강제선택) */
export const isTypeItem = (i: AnyItem) => (i.kind === 'likert' ? i.block === 'core' : i.block === 'fc-type');

/** 응답 x가 주어졌을 때 가설 t별 로그 우도. bias = 묵종 경향 */
function logLik(item: AnyItem, x: number, bias: number): number[] {
  if (item.kind === 'likert') {
    const v = (item.key === 1 ? x : 6 - x) - item.key * bias;
    return TYPES.map((t) => logNormal(v, mu(item.type!, t)));
  }
  const p = (t: number) => (t === item.a.type ? B.fcSelf[x - 1] : t === item.b.type ? B.fcSelf[4 - x] : B.fcNeither[x - 1]);
  return TYPES.map((t) => Math.log(p(t)));
}

const normalize = (logs: number[]) => {
  const m = Math.max(...logs);
  const e = logs.map((l) => Math.exp(l - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
};

const entropy = (p: number[]) => -p.reduce((s, v) => (v > 0 ? s + v * Math.log(v) : s), 0);

/** 묵종 경향: 응답한 리커트 핵심·본능 문항의 원응답 평균 − 3 */
export function acquiescence(a: Answers): number {
  const xs: number[] = [];
  for (const [id, x] of Object.entries(a)) {
    const i = itemById.get(id);
    if (i?.kind === 'likert' && (i.block === 'core' || i.block === 'instinct')) xs.push(x);
  }
  return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length - 3 : 0;
}

/** 응답 전체로 계산한 주유형 사후확률 (유형 1–9 순서) */
export function posterior(a: Answers): number[] {
  const bias = acquiescence(a);
  const logs = TYPES.map(() => 0);
  for (const [id, x] of Object.entries(a)) {
    const i = itemById.get(id);
    if (!i || !isTypeItem(i)) continue;
    logLik(i, x, bias).forEach((l, k) => (logs[k] += l));
  }
  return normalize(logs);
}

/** 문항의 기대 정보 이득 */
export function expectedInfoGain(item: AnyItem, post: number[], bias: number): number {
  const outcomes = item.kind === 'likert' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
  const h0 = entropy(post);
  // 리커트 우도는 연속 밀도이므로 응답 범주별로 정규화해 이산 분포로 쓴다
  const lik = outcomes.map((x) => logLik(item, x, bias).map(Math.exp));
  const colSum = TYPES.map((_, k) => lik.reduce((s, row) => s + row[k], 0));
  let eh = 0;
  for (const row of lik) {
    const joint = row.map((l, k) => (l / colSum[k]) * post[k]);
    const px = joint.reduce((s, v) => s + v, 0);
    if (px > 0) eh += px * entropy(joint.map((v) => v / px));
  }
  return h0 - eh;
}

/** 아직 묻지 않은 유형 문항 중 EIG 최대 문항. 동점이면 덜 출제된 측면 우선 */
export function pickNext(a: Answers, asked: ReadonlySet<string>, pool: readonly AnyItem[]): AnyItem | null {
  const post = posterior(a);
  const bias = acquiescence(a);
  const facetCount = new Map<string, number>();
  for (const id of asked) {
    const i = itemById.get(id);
    if (i?.kind === 'likert' && i.block === 'core') facetCount.set(`${i.type}-${i.facet}`, (facetCount.get(`${i.type}-${i.facet}`) ?? 0) + 1);
  }
  let best: AnyItem | null = null;
  let bestScore = -Infinity;
  for (const i of pool) {
    if (asked.has(i.id)) continue;
    const used = i.kind === 'likert' ? facetCount.get(`${i.type}-${i.facet}`) ?? 0 : 0;
    const score = expectedInfoGain(i, post, bias) - used * 1e-4;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}
