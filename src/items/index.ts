import { FACETS, type ForcedChoiceItem, type LikertItem, type TypeBank } from './schema';
import { forcedChoiceTypePairs, instinctPairsAll } from './fcBuild';
import { instinctBank } from './instincts';
import { validityItems } from './validity';
import { type1 } from './types/type1';
import { type2 } from './types/type2';
import { type3 } from './types/type3';
import { type4 } from './types/type4';
import { type5 } from './types/type5';
import { type6 } from './types/type6';
import { type7 } from './types/type7';
import { type8 } from './types/type8';
import { type9 } from './types/type9';

export const typeBanks: readonly TypeBank[] = [type1, type2, type3, type4, type5, type6, type7, type8, type9];

/** 블록 A: 유형 핵심 문항. id = T{type}-{facet}-{1..4} */
export const coreItems: LikertItem[] = typeBanks.flatMap((bank) =>
  FACETS.flatMap((facet) =>
    bank.facets[facet].map(([key, text], i) => ({
      id: `T${bank.type}-${facet}-${i + 1}`,
      block: 'core' as const,
      type: bank.type,
      facet,
      key,
      text,
    })),
  ),
);

/** 블록 B: 통합 수준 문항 */
export const levelItems: LikertItem[] = typeBanks.flatMap((bank) =>
  (['healthy', 'stress'] as const).flatMap((level) =>
    bank.levels[level].map((text, i) => ({
      id: `L${bank.type}-${level}-${i + 1}`,
      block: 'level' as const,
      type: bank.type,
      level,
      key: 1 as const,
      text,
    })),
  ),
);

/** 블록 C: 본능 문항 */
export const instinctItems: LikertItem[] = (['sp', 'so', 'sx'] as const).flatMap((instinct) =>
  Object.entries(instinctBank[instinct].facets).flatMap(([facet, items]) =>
    items.map(([key, text], i) => ({
      id: `I-${instinct}-${facet}-${i + 1}`,
      block: 'instinct' as const,
      instinct,
      facet,
      key,
      text,
    })),
  ),
);

export { validityItems };

export const fcTypeItems: ForcedChoiceItem[] = forcedChoiceTypePairs;
export const fcInstinctItems: ForcedChoiceItem[] = instinctPairsAll;

export const allLikertItems: LikertItem[] = [...coreItems, ...levelItems, ...instinctItems, ...validityItems];
export const allForcedChoiceItems: ForcedChoiceItem[] = [...fcTypeItems, ...fcInstinctItems];

export type AnyItem = ({ kind: 'likert' } & LikertItem) | ({ kind: 'fc' } & ForcedChoiceItem);

export const itemById: ReadonlyMap<string, AnyItem> = new Map<string, AnyItem>([
  ...allLikertItems.map((i) => [i.id, { kind: 'likert' as const, ...i }] as const),
  ...allForcedChoiceItems.map((i) => [i.id, { kind: 'fc' as const, ...i }] as const),
]);
