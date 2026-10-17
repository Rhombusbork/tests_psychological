import { scoreAll, TYPES } from '../src/engine/scoring';
import { makePersona, runPersona } from '../src/engine/simulate';
import { checkValidity } from '../src/engine/validity';

const N = Number(process.argv[2] ?? 200);
const profile = (process.argv[3] ?? 'standard') as 'standard' | 'hard';
console.log(`조건: ${profile}, 유형당 ${N}명`);
let correct = 0;
let instCorrect = 0;
let total = 0;
const confusion: Record<number, Record<number, number>> = {};
const lengths: number[] = [];

for (const t of TYPES) {
  confusion[t] = {};
  for (let k = 0; k < N; k++) {
    const seed = t * 100000 + k;
    const p = makePersona(t, seed, profile);
    const s = runPersona(p, seed);
    const r = scoreAll(s.answers);
    lengths.push(s.queue.length);
    confusion[t][r.main] = (confusion[t][r.main] ?? 0) + 1;
    if (r.main === t) correct++;
    if (r.stack[0] === p.instinct) instCorrect++;
    total++;
  }
}

let cautioned = 0;
for (let k = 0; k < N; k++) {
  const s = runPersona(makePersona(null, 999000 + k), 999000 + k);
  if (checkValidity(s.answers, s.queue, s.times).caution) cautioned++;
}
let falseCaution = 0;
for (let k = 0; k < N; k++) {
  const seed = 555000 + k;
  const s = runPersona(makePersona(TYPES[k % 9], seed), seed);
  if (checkValidity(s.answers, s.queue, s.times).caution) falseCaution++;
}

const pct = (x: number, n: number) => `${((x / n) * 100).toFixed(1)}%`;
console.log(`주유형 정확도        ${pct(correct, total)}  (${correct}/${total})`);
console.log(`1순위 본능 정확도    ${pct(instCorrect, total)}`);
console.log(`무작위 응답 경고율   ${pct(cautioned, N)}`);
console.log(`정상 응답 오경고율   ${pct(falseCaution, N)}`);
console.log(`문항 수              ${Math.min(...lengths)}–${Math.max(...lengths)}`);
console.log('\n혼동 행렬 (행 = 실제, 열 = 판정)');
console.log('     ' + TYPES.map((t) => String(t).padStart(4)).join(''));
for (const t of TYPES) console.log(`  ${t}  ` + TYPES.map((u) => String(confusion[t][u] ?? 0).padStart(4)).join(''));
const ok = correct / total >= (profile === 'hard' ? 0.75 : 0.9) && cautioned / N >= 0.8;
console.log(ok ? '\n✔ 기준 통과' : '\n✖ 기준 미달');
process.exit(ok ? 0 : 1);
