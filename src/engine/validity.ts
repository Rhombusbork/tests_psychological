import { allLikertItems, validityItems } from '../items/index';
import { CONFIG } from './config';
import type { Answers } from './scoring';

export interface ValidityCheck {
  key: 'consistency' | 'attention' | 'desirability' | 'straightLine' | 'variance' | 'speed';
  label: string;
  value: number;
  warn: boolean;
}

const likertIds = new Set(allLikertItems.map((i) => i.id));

/** order: 실제 응답 순서(문항 id), times: 문항별 응답 ms */
export function checkValidity(a: Answers, order: string[], times: Readonly<Record<string, number>>) {
  const V = CONFIG.validity;
  const mean = (xs: number[]) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0);

  const cons = validityItems.filter((v) => v.validity === 'consistency' && a[v.id] !== undefined && a[v.pairWith!] !== undefined);
  const consistency = mean(cons.map((v) => Math.abs(a[v.id] - a[v.pairWith!])));
  const attentionWrong = validityItems.filter((v) => v.validity === 'attention' && a[v.id] !== undefined && a[v.id] !== v.expected).length;
  const desirability = mean(validityItems.filter((v) => v.validity === 'desirability' && a[v.id] !== undefined).map((v) => a[v.id]));

  const seq = order.filter((id) => likertIds.has(id) && a[id] !== undefined).map((id) => a[id]);
  let run = 0;
  let maxRun = 0;
  seq.forEach((x, k) => {
    run = k > 0 && seq[k - 1] === x ? run + 1 : 1;
    maxRun = Math.max(maxRun, run);
  });
  const m = mean(seq);
  const sdv = Math.sqrt(mean(seq.map((x) => (x - m) ** 2)));

  const ts = Object.values(times).sort((x, y) => x - y);
  const median = ts.length ? ts[Math.floor(ts.length / 2)] : Infinity;

  const checks: ValidityCheck[] = [
    { key: 'consistency', label: '응답 일관성 (같은 의미 문항 간 차이)', value: consistency, warn: consistency > V.consistencyMaxDiff },
    { key: 'attention', label: '주의 확인 문항 오답 수', value: attentionWrong, warn: attentionWrong > V.attentionMaxWrong },
    { key: 'desirability', label: '과장 응답 경향', value: desirability, warn: desirability >= V.desirabilityMax },
    { key: 'straightLine', label: '같은 응답 연속 최대 길이', value: maxRun, warn: maxRun >= V.straightLineMax },
    { key: 'variance', label: '응답 분산 (표준편차)', value: sdv, warn: sdv < V.minSd },
    { key: 'speed', label: '문항당 응답시간 중앙값 (초)', value: median / 1000, warn: median < V.minMedianMs },
  ];
  const warnings = checks.filter((c) => c.warn).length;
  return { checks, warnings, caution: warnings >= V.cautionWarnings };
}
