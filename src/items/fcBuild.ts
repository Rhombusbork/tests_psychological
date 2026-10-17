import type { ForcedChoiceItem } from './schema';
import { typePairs } from './forcedChoice';
import { instinctPairs } from './instincts';

const counter = new Map<string, number>();
const nextIndex = (key: string) => {
  const n = (counter.get(key) ?? 0) + 1;
  counter.set(key, n);
  return n;
};

/** id = FC-{a}{b}-{n} */
export const forcedChoiceTypePairs: ForcedChoiceItem[] = typePairs.map(([a, b, ta, tb]) => ({
  id: `FC-${a}${b}-${nextIndex(`${a}${b}`)}`,
  block: 'fc-type',
  a: { type: a, text: ta },
  b: { type: b, text: tb },
}));

/** id = FI-{a}-{b}-{n} */
export const instinctPairsAll: ForcedChoiceItem[] = instinctPairs.map(([a, b, ta, tb]) => ({
  id: `FI-${a}-${b}-${nextIndex(`${a}-${b}`)}`,
  block: 'fc-instinct',
  a: { instinct: a, text: ta },
  b: { instinct: b, text: tb },
}));
