import { coreItems, fcTypeItems, itemById, type AnyItem } from '../items/index';
import { ITEM_BANK_VERSION } from '../items/version';
import { posterior, pickNext } from './bayes';
import { CONFIG } from './config';
import { buildFinal, buildPhase1 } from './order';
import { scoreTypes } from './scoring';

export interface Session {
  version: string;
  seed: number;
  phase: 1 | 2 | 3 | 'done';
  /** 각 단계가 queue에서 끝나는 위치 (확정된 단계만) */
  phaseEnds: number[];
  queue: string[];
  index: number;
  answers: Record<string, number>;
  times: Record<string, number>;
  /** 2단계에서 문항마다 기록한 최대 사후확률 (정체 판정용) */
  trace: number[];
}

const adaptivePool: AnyItem[] = [...coreItems, ...fcTypeItems].map((i) => itemById.get(i.id)!);
const FINAL_COUNT = 18;

export function newSession(seed = Math.floor(Math.random() * 2 ** 31)): Session {
  const queue = buildPhase1(seed);
  return { version: ITEM_BANK_VERSION, seed, phase: 1, phaseEnds: [queue.length], queue, index: 0, answers: {}, times: {}, trace: [] };
}

/** 응답 기록 후 다음 위치로. 큐 끝에 도달하면 단계에 따라 다음 문항을 정한다. */
export function answer(s: Session, id: string, value: number, ms: number): Session {
  const next: Session = {
    ...s,
    answers: { ...s.answers, [id]: value },
    times: { ...s.times, [id]: ms },
    index: s.index + 1,
  };
  if (next.index < next.queue.length) return next;
  return advance(next);
}

function shouldStop(s: Session): boolean {
  const S = CONFIG.stop;
  const n = s.trace.length;
  const pmax = Math.max(...posterior(s.answers));
  if (n >= S.minAdaptive && pmax >= S.targetPosterior) return true;
  if (n >= S.plateauAfter) {
    const w = s.trace.slice(-S.plateauWindow);
    if (Math.max(...w) - Math.min(...w) < S.plateauDelta) return true;
  }
  return false;
}

function advance(s: Session): Session {
  if (s.phase === 1 || s.phase === 2) {
    const trace = s.phase === 2 ? [...s.trace, Math.max(...posterior(s.answers))] : s.trace;
    const cur = { ...s, phase: 2 as const, trace };
    const asked = new Set(cur.queue);
    const nextItem = s.phase === 2 && shouldStop(cur) ? null : pickNext(cur.answers, asked, adaptivePool);
    if (nextItem) return { ...cur, queue: [...cur.queue, nextItem.id] };
    const ranking = scoreTypes(cur.answers);
    const add = buildFinal([ranking[0].type, ranking[1].type], cur.seed);
    return { ...cur, phase: 3, queue: [...cur.queue, ...add], phaseEnds: [...cur.phaseEnds, cur.queue.length, cur.queue.length + add.length] };
  }
  return { ...s, phase: 'done' };
}

export const back = (s: Session): Session => ({ ...s, index: Math.max(0, s.index - 1), phase: s.phase === 'done' ? 3 : s.phase });

/** 예상 총 문항 수 (진행률 표시용). 2단계는 사후확률 진척도로 남은 수를 추정한다. */
export function expectedTotal(s: Session): number {
  if (s.phase === 1) return s.queue.length + 40 + FINAL_COUNT;
  if (s.phase === 2) {
    const pmax = Math.max(...posterior(s.answers));
    const remaining = Math.max(1, Math.round((1 - pmax / CONFIG.stop.targetPosterior) * 40));
    return s.queue.length + remaining + FINAL_COUNT;
  }
  return s.queue.length;
}

export { CONFIG };
