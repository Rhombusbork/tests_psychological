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
const DOUBLE = [/그리고/, /또는/];
const checkText = (id: string, t: string) => {
  if (t.length < 10 || t.length > 60) warnings.push(`${id}: 길이 ${t.length}자`);
  for (const w of BANNED) if (t.includes(w)) errors.push(`${id}: 금지어 "${w}"`);
  for (const re of DOUBLE) if (re.test(t)) warnings.push(`${id}: 이중질문 의심 "${t}"`);
};
for (const i of allLikertItems) if (i.validity !== 'attention') checkText(i.id, i.text);
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
