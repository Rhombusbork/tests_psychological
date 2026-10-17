import { ITEM_BANK_VERSION } from '../items/version';
import { CONFIG } from './config';
import { buildPhase1, buildPhase2, buildPhase3 } from './order';
import { scoreTypes } from './scoring';

export interface Session {
  version: string;
  seed: number;
  phase: 1 | 2 | 3 | 'done';
  /** 각 단계가 queue에서 끝나는 위치 */
  phaseEnds: number[];
  queue: string[];
  index: number;
  answers: Record<string, number>;
  times: Record<string, number>;
}

export function newSession(seed = Math.floor(Math.random() * 2 ** 31)): Session {
  const queue = buildPhase1(seed);
  return { version: ITEM_BANK_VERSION, seed, phase: 1, phaseEnds: [queue.length], queue, index: 0, answers: {}, times: {} };
}

/** 응답 기록 후 다음 위치로. 단계 끝이면 다음 단계 문항을 붙인다. */
export function answer(s: Session, id: string, value: number, ms: number): Session {
  const next: Session = {
    ...s,
    answers: { ...s.answers, [id]: value },
    times: { ...s.times, [id]: ms },
    index: s.index + 1,
  };
  if (next.index < next.queue.length) return next;
  return advancePhase(next);
}

function advancePhase(s: Session): Session {
  const ranking = scoreTypes(s.answers);
  if (s.phase === 1) {
    const gap = ranking[0].score - ranking[1].score;
    const add = buildPhase2(ranking.map((r) => r.type), gap, s.seed);
    return { ...s, phase: 2, queue: [...s.queue, ...add], phaseEnds: [...s.phaseEnds, s.queue.length + add.length] };
  }
  if (s.phase === 2) {
    const add = buildPhase3([ranking[0].type, ranking[1].type], s.seed);
    return { ...s, phase: 3, queue: [...s.queue, ...add], phaseEnds: [...s.phaseEnds, s.queue.length + add.length] };
  }
  return { ...s, phase: 'done' };
}

export const back = (s: Session): Session => ({ ...s, index: Math.max(0, s.index - 1), phase: s.phase === 'done' ? 3 : s.phase });

/** 예상 총 문항 수 (진행률 표시용) */
export const expectedTotal = (s: Session) =>
  s.phase === 1 ? s.queue.length + 24 + 12 : s.phase === 2 ? s.queue.length + 12 : s.queue.length;

export { CONFIG };
