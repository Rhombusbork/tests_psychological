import {
  allForcedChoiceItems, allLikertItems, coreItems, fcTypeItems, instinctItems, levelItems, typeBanks, validityItems,
} from '../src/items/index';
import { FACETS } from '../src/items/schema';

const errors: string[] = [];
const warnings: string[] = [];

// 1. 유형별 측면 구조: 측면당 4문항, 역문항 정확히 1개
for (const bank of typeBanks) {
  for (const facet of FACETS) {
    const items = bank.facets[facet];
    if (items.length !== 4) errors.push(`T${bank.type} ${facet}: 문항 ${items.length}개 (4개 필요)`);
    const rev = items.filter(([k]) => k === -1).length;
    if (rev !== 1) errors.push(`T${bank.type} ${facet}: 역문항 ${rev}개 (1개 필요)`);
  }
  if (bank.levels.healthy.length !== 3 || bank.levels.stress.length !== 3)
    errors.push(`T${bank.type} 수준 문항 수 오류`);
}

// 2. ID · 문장 중복
const ids = [...allLikertItems.map((i) => i.id), ...allForcedChoiceItems.map((i) => i.id)];
for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) errors.push(`ID 중복: ${id}`);
const texts = allLikertItems.map((i) => i.text);
for (const t of texts.filter((t, i) => texts.indexOf(t) !== i)) errors.push(`리커트 문장 중복: ${t}`);

// 3. 길이 · 금지어 · 이중질문 패턴
const BANNED = ['에니어그램', '날개', '격정', '고착', '본능', '유형'];
/** 문항 품질 규칙 (docs/ITEM_DESIGN.md 3절) */
const RULES: [RegExp, string][] = [
  [/그리고|또는|거나|[,，·]/, '이중 질문 (개념 나열)'],
  [/때가 있다|때도 있다|적이 있다|경우가 있다/, '빈도 하한 표현 (누구나 동의)'],
  [/나도 모르게|무의식/, '자각 불가능한 내용을 물음'],
  [/남들보다|남보다 더|다른 사람보다/, '타인 비교 요구'],
];
const checkText = (id: string, t: string, strict = true) => {
  if (t.length < 10 || t.length > 60) warnings.push(`${id}: 길이 ${t.length}자`);
  for (const w of BANNED) if (t.includes(w)) errors.push(`${id}: 금지어 "${w}"`);
  if (strict) for (const [re, why] of RULES) if (re.test(t)) errors.push(`${id}: ${why} "${t}"`);
};

// 같은 유형·본능 안 문장 유사도 (글자 bigram Jaccard)
const bigrams = (t: string) => {
  const c = t.replace(/[\s.]/g, '');
  return new Set(Array.from({ length: c.length - 1 }, (_, k) => c.slice(k, k + 2)));
};
const jaccard = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size;
const SIM_MAX = 0.4;
for (const i of allLikertItems) if (i.validity !== 'attention') checkText(i.id, i.text, i.validity !== 'desirability');

const groups = new Map<string, typeof allLikertItems>();
for (const i of allLikertItems) {
  if (i.block !== 'core' && i.block !== 'instinct') continue;
  const g = String(i.type ?? i.instinct);
  groups.set(g, [...(groups.get(g) ?? []), i]);
}
for (const items of groups.values())
  for (let x = 0; x < items.length; x++)
    for (let y = x + 1; y < items.length; y++) {
      const sim = jaccard(bigrams(items[x].text), bigrams(items[y].text));
      if (sim > SIM_MAX) errors.push(`유사 문항 ${items[x].id} ↔ ${items[y].id} (${sim.toFixed(2)})`);
    }

// 강제선택 문장 재사용 금지
const fcTexts = allForcedChoiceItems.flatMap((i) => [i.a.text, i.b.text]);
for (const t of fcTexts.filter((t, k) => fcTexts.indexOf(t) !== k)) errors.push(`강제선택 문장 재사용: ${t}`);
for (const i of allForcedChoiceItems) { checkText(`${i.id}A`, i.a.text); checkText(`${i.id}B`, i.b.text); }

// 4. 강제선택: 36쌍 × 2, 선택지 길이 균형
const pairCount = new Map<string, number>();
for (const i of fcTypeItems) {
  const k = `${i.a.type}-${i.b.type}`;
  pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
  const diff = Math.abs(i.a.text.length - i.b.text.length);
  if (diff > 8) warnings.push(`${i.id}: 선택지 길이 차 ${diff}자`);
}
for (let a = 1; a <= 9; a++)
  for (let b = a + 1; b <= 9; b++)
    if (pairCount.get(`${a}-${b}`) !== 2) errors.push(`강제선택 쌍 ${a}-${b}: ${pairCount.get(`${a}-${b}`) ?? 0}개 (2개 필요)`);

// 5. 일관성 쌍 참조 확인
const coreIds = new Set(coreItems.map((i) => i.id));
for (const v of validityItems) if (v.pairWith && !coreIds.has(v.pairWith)) errors.push(`${v.id}: pairWith ${v.pairWith} 없음`);

// 6. 본능 측면당 역문항 1개
const byFacet = new Map<string, number>();
for (const i of instinctItems) if (i.key === -1) byFacet.set(`${i.instinct}-${i.facet}`, (byFacet.get(`${i.instinct}-${i.facet}`) ?? 0) + 1);
if (byFacet.size !== 12 || [...byFacet.values()].some((n) => n !== 1)) errors.push('본능 측면별 역문항 구조 오류');

console.log('── 문항 은행 요약 ──');
console.log(`A 유형 핵심   ${coreItems.length}`);
console.log(`B 통합 수준   ${levelItems.length}`);
console.log(`C 본능        ${instinctItems.length}`);
console.log(`D 타당도      ${validityItems.length}`);
console.log(`E 유형 변별   ${fcTypeItems.length}`);
console.log(`F 본능 변별   ${allForcedChoiceItems.length - fcTypeItems.length}`);
console.log(`합계          ${allLikertItems.length + allForcedChoiceItems.length}`);
console.log(`역문항 비율   ${((coreItems.filter((i) => i.key === -1).length / coreItems.length) * 100).toFixed(1)}%`);
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);
console.log(errors.length ? `\n오류 ${errors.length}건` : `\n✔ 오류 없음 (경고 ${warnings.length}건)`);
process.exit(errors.length ? 1 : 0);
