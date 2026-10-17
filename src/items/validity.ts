import type { LikertItem } from './schema';

/**
 * 타당도 문항.
 * - consistency: pairWith 문항과 같은 의미를 다른 표현으로 묻는다 (응답 차이로 일관성 측정).
 * - attention: expected 값을 골라야 정답.
 * - desirability: 현실적으로 "매우 그렇다"가 드문 진술 (과장 응답 탐지).
 */
export const validityItems: readonly LikertItem[] = [
  { id: 'V-C1', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T1-attention-2', text: '사소한 실수라도 발견하면 그냥 넘기기 힘들다.' },
  { id: 'V-C2', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T2-attention-1', text: '남이 무엇을 필요로 하는지 내가 먼저 알아채는 편이다.' },
  { id: 'V-C3', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T3-desire-1', text: '남들이 인정할 만한 결과를 내는 것이 나에게 무척 중요하다.' },
  { id: 'V-C4', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T5-passion-2', text: '사람들 속에 오래 있으면 에너지가 금방 떨어진다.' },
  { id: 'V-C5', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T6-fixation-1', text: '결정하고 나서도 그게 옳았는지 자꾸 의심하게 된다.' },
  { id: 'V-C6', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T7-fixation-1', text: '앞으로 해 보고 싶은 계획이 머릿속에 늘 많다.' },
  { id: 'V-C7', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T8-fear-1', text: '누군가에게 통제받는 상황은 도저히 참기 어렵다.' },
  { id: 'V-C8', block: 'validity', validity: 'consistency', key: 1, pairWith: 'T9-fear-2', text: '누군가와 정면으로 부딪쳐야 할 때면 마음이 무겁다.' },
  { id: 'V-A1', block: 'validity', validity: 'attention', key: 1, expected: 4, text: '응답 확인 문항입니다. 이 문항에는 "그런 편이다"를 선택해 주세요.' },
  { id: 'V-A2', block: 'validity', validity: 'attention', key: 1, expected: 1, text: '응답 확인 문항입니다. 이 문항에는 "전혀 그렇지 않다"를 선택해 주세요.' },
  { id: 'V-D1', block: 'validity', validity: 'desirability', key: 1, text: '나는 지금까지 단 한 번도 거짓말을 한 적이 없다.' },
  { id: 'V-D2', block: 'validity', validity: 'desirability', key: 1, text: '나는 누구에게도 화를 낸 적이 없다.' },
  { id: 'V-D3', block: 'validity', validity: 'desirability', key: 1, text: '나는 어떤 사람이든 언제나 좋아한다.' },
  { id: 'V-D4', block: 'validity', validity: 'desirability', key: 1, text: '나는 약속을 어긴 적이 한 번도 없다.' },
  { id: 'V-D5', block: 'validity', validity: 'desirability', key: 1, text: '나는 어떤 상황에서도 감정을 완벽하게 다스린다.' },
  { id: 'V-D6', block: 'validity', validity: 'desirability', key: 1, text: '나는 남의 험담을 해 본 적이 없다.' },
  { id: 'V-D7', block: 'validity', validity: 'desirability', key: 1, text: '나는 실수를 하면 언제나 그 자리에서 바로 인정한다.' },
  { id: 'V-D8', block: 'validity', validity: 'desirability', key: 1, text: '나는 누구에게나 항상 똑같이 친절하다.' },
];
