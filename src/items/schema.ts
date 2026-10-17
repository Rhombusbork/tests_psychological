export type EnneaType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Instinct = 'sp' | 'so' | 'sx';
export type Center = 'gut' | 'heart' | 'head';

/** 1 = 정문항, -1 = 역문항 (채점 시 6 - x) */
export type Key = 1 | -1;

export const FACETS = ['fear', 'desire', 'passion', 'fixation', 'attention', 'defense'] as const;
export type Facet = (typeof FACETS)[number];

export const LIKERT_LABELS = [
  '전혀 그렇지 않다',
  '그렇지 않은 편이다',
  '보통이다',
  '그런 편이다',
  '매우 그렇다',
] as const;

export const FC_LABELS = ['A가 훨씬 더 나와 같다', 'A가 약간 더', 'B가 약간 더', 'B가 훨씬 더 나와 같다'] as const;

/** [key, text] */
export type RawItem = readonly [Key, string];

export interface TypeBank {
  type: EnneaType;
  name: string;
  facets: Record<Facet, readonly RawItem[]>;
  levels: { healthy: readonly string[]; stress: readonly string[] };
}

export interface LikertItem {
  id: string;
  block: 'core' | 'level' | 'instinct' | 'validity';
  text: string;
  key: Key;
  type?: EnneaType;
  facet?: string;
  instinct?: Instinct;
  level?: 'healthy' | 'stress';
  validity?: 'consistency' | 'attention' | 'desirability';
  /** 일관성 쌍 상대 문항 id, 주의 문항 정답값 */
  pairWith?: string;
  expected?: 1 | 2 | 3 | 4 | 5;
}

export interface ForcedChoiceItem {
  id: string;
  block: 'fc-type' | 'fc-instinct';
  a: { text: string; type?: EnneaType; instinct?: Instinct };
  b: { text: string; type?: EnneaType; instinct?: Instinct };
}

export const CENTERS: Record<Center, readonly EnneaType[]> = {
  gut: [8, 9, 1],
  heart: [2, 3, 4],
  head: [5, 6, 7],
};
