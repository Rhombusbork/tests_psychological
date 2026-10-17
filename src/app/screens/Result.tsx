import { useMemo, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { CENTER_CONTENT, FACET_LABELS, INSTINCT_CONTENT, LEVEL_CONTENT, SUBTYPES } from '../../content/misc';
import { TYPE_CONTENT } from '../../content/types';
import { CONFIG } from '../../engine/config';
import { scoreAll, TYPES } from '../../engine/scoring';
import type { Session } from '../../engine/session';
import { checkValidity } from '../../engine/validity';
import { FACETS, type Center } from '../../items/schema';
import { itemById } from '../../items/index';
import { FC_LABELS, LIKERT_LABELS } from '../../items/schema';
import { Bar, List, Pill, Section } from '../components/ui';

export function Result({ session, onRestart }: { session: Session; onRestart: () => void }) {
  const r = useMemo(() => scoreAll(session.answers), [session.answers]);
  const v = useMemo(() => checkValidity(session.answers, session.queue, session.times), [session]);
  const main = TYPE_CONTENT[r.main];
  const byType = new Map(r.types.map((t) => [t.type, t]));
  const gap = r.types[0].score - r.types[1].score;
  const showCandidates = r.lowConfidence || gap < CONFIG.phase2CloseGap;
  const wingLabel = r.wing.balanced ? `${r.main}w${Object.keys(r.wing.scores).join('/')}` : `${r.main}w${r.wing.type}`;
  const subtype = SUBTYPES[r.subtype];
  const radar = TYPES.map((t) => ({ t: `${t}`, score: byType.get(t)!.score }));

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:py-12">
      <header className="rounded-2xl bg-indigo-600 p-6 text-white shadow sm:p-8">
        <p className="text-sm opacity-80">나의 에니어그램 결과</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{r.main}번 · {main.name}</h1>
        <p className="mt-1 opacity-90">{main.tagline}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['유형·날개', wingLabel],
            ['하위유형', `${INSTINCT_CONTENT[r.stack[0]].short}${r.main} ${subtype.name}`],
            ['트라이타입', r.tritype.join('')],
            ['확신도', `${Math.round(r.confidence * 100)}%`],
          ].map(([k, val]) => (
            <div key={k}>
              <dt className="text-xs opacity-75">{k}</dt>
              <dd className="text-lg font-semibold">{val}</dd>
            </div>
          ))}
        </dl>
      </header>

      {v.caution && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800">
          <b>해석 주의.</b> 응답 패턴에서 신뢰도 경고가 {v.warnings}개 발견되었습니다. 아래 "응답 타당도"를 확인하고, 필요하면 충분한 시간을 두고 다시 검사해 보세요.
        </div>
      )}

      <Section title="9유형 점수">
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="t" tick={{ fill: 'currentColor', fontSize: 13 }} />
                <Radar dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} isAnimationActive={false} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {r.types.map((t) => (
              <Bar key={t.type} label={`${t.type} ${TYPE_CONTENT[t.type].name}`} value={t.score} highlight={t.type === r.main} />
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-stone-500">점수는 0–100 상대 점수로, 내 응답 안에서 각 유형이 얼마나 두드러지는지를 나타냅니다. 확신도는 모든 응답을 종합했을 때 주유형이 맞을 확률의 추정치입니다.</p>
      </Section>

      {showCandidates && (
        <Section title="후보 유형 비교">
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            상위 유형들의 점수가 가깝습니다. 행동보다 <b>가장 깊은 두려움과 욕구</b>가 어느 쪽에 더 맞는지 비교해 보세요.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {r.types.slice(0, 3).map((t) => {
              const c = TYPE_CONTENT[t.type];
              return (
                <div key={t.type} className="rounded-xl p-4 text-sm ring-1 ring-stone-200 dark:ring-stone-800">
                  <p className="font-semibold">{t.type}번 {c.name} <span className="text-stone-500">({Math.round(t.probability * 100)}%)</span></p>
                  <p className="mt-2 text-stone-500">두려움</p><p>{c.fear}</p>
                  <p className="mt-2 text-stone-500">욕구</p><p>{c.desire}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title={`${r.main}번 ${main.name} 상세`}>
        <p className="leading-relaxed text-stone-700 dark:text-stone-300">{main.summary}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {[['핵심 두려움', main.fear], ['핵심 욕구', main.desire], ['정서 습관', main.passion], ['사고 습관', main.fixation]].map(([k, val]) => (
            <div key={k}><dt className="text-stone-500">{k}</dt><dd className="mt-0.5">{val}</dd></div>
          ))}
        </dl>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div><h3 className="mb-2 text-sm font-semibold">강점</h3><List items={main.strengths} /></div>
          <div><h3 className="mb-2 text-sm font-semibold">맹점</h3><List items={main.blindSpots} /></div>
          <div><h3 className="mb-2 text-sm font-semibold">성장 방향</h3><List items={main.growth} /></div>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950"><b>성장할 때 → {main.growthArrow}번</b><p className="mt-1">{main.atGrowth}</p></div>
          <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950"><b>스트레스 시 → {main.stressArrow}번</b><p className="mt-1">{main.atStress}</p></div>
        </div>
      </Section>

      <Section title="측면별 프로파일">
        <div className="space-y-2">
          {FACETS.map((f) => <Bar key={f} label={FACET_LABELS[f]} value={byType.get(r.main)!.facets[f]} max={5} highlight />)}
        </div>
        <p className="mt-3 text-xs text-stone-500">주유형 문항에 대한 측면별 평균 동의 정도(1–5)입니다. 높을수록 그 측면이 내 동기에 강하게 작동합니다.</p>
      </Section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="날개">
          <div className="space-y-2">
            {Object.entries(r.wing.scores).map(([t, s]) => (
              <Bar key={t} label={`${t}번 ${TYPE_CONTENT[Number(t) as 1].name}`} value={s} highlight={!r.wing.balanced && Number(t) === r.wing.type} />
            ))}
          </div>
          <p className="mt-3 text-sm">
            {r.wing.balanced ? '두 날개가 비슷하게 작동합니다.' : `${r.wing.type}번 날개가 주유형에 ${TYPE_CONTENT[r.wing.type].name}의 색채를 더합니다.`}
          </p>
        </Section>

        <Section title="센터">
          <div className="space-y-2">
            {(Object.keys(CENTER_CONTENT) as Center[]).map((c) => <Bar key={c} label={CENTER_CONTENT[c].name} value={r.centers[c]} />)}
          </div>
          <p className="mt-3 text-xs text-stone-500">{CENTER_CONTENT.gut.desc} {CENTER_CONTENT.heart.desc} {CENTER_CONTENT.head.desc}</p>
        </Section>
      </div>

      <Section title="본능과 하위유형">
        <div className="flex flex-wrap gap-2">
          {r.stack.map((n, k) => <Pill key={n}>{k + 1}. {INSTINCT_CONTENT[n].name} ({INSTINCT_CONTENT[n].short})</Pill>)}
        </div>
        <div className="mt-4 space-y-2">
          {r.instincts.map((i) => <Bar key={i.instinct} label={INSTINCT_CONTENT[i.instinct].name} value={i.score} highlight={i.instinct === r.stack[0]} />)}
        </div>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{INSTINCT_CONTENT[r.stack[0]].desc}</p>
        <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
          <p className="font-semibold">{INSTINCT_CONTENT[r.stack[0]].short}{r.main} · {subtype.name}</p>
          <p className="mt-1 text-sm">{subtype.desc}</p>
        </div>
      </Section>

      <Section title="트라이타입">
        <p className="text-2xl font-bold tracking-widest">{r.tritype.join('')}</p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          각 센터에서 가장 강한 유형: {r.tritype.map((t) => `${t}번 ${TYPE_CONTENT[t].name}`).join(' · ')}. 주유형이 막히면 나머지 두 유형의 전략을 차례로 사용합니다.
        </p>
      </Section>

      {r.level && (
        <Section title="통합 수준">
          <div className="flex items-center gap-1">
            {Array.from({ length: 9 }, (_, k) => k + 1).map((n) => (
              <div key={n} className={`flex h-9 flex-1 items-center justify-center rounded text-xs ${n === r.level!.value ? 'bg-indigo-600 font-bold text-white' : n <= 3 ? 'bg-emerald-100 dark:bg-emerald-950' : n <= 6 ? 'bg-stone-100 dark:bg-stone-800' : 'bg-rose-100 dark:bg-rose-950'}`}>{n}</div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-stone-500"><span>건강</span><span>평균</span><span>스트레스</span></div>
          <p className="mt-4 font-semibold">{LEVEL_CONTENT[r.level.band].name}</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{LEVEL_CONTENT[r.level.band].desc}</p>
        </Section>
      )}

      <Section title="응답 타당도">
        <table className="w-full text-sm">
          <tbody>
            {v.checks.map((c) => (
              <tr key={c.key} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="py-2">{c.label}</td>
                <td className="py-2 text-right tabular-nums">{Number.isFinite(c.value) ? c.value.toFixed(c.key === 'attention' || c.key === 'straightLine' ? 0 : 2) : '–'}</td>
                <td className="w-16 py-2 text-right">{c.warn ? <span className="text-amber-600">주의</span> : <span className="text-emerald-600">양호</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <FlaggedItems session={session} />

      <p className="px-2 text-xs leading-relaxed text-stone-500">
        이 결과는 자기이해를 위한 비공식 검사 결과이며 임상적 진단이 아닙니다. 에니어그램 유형은 검사만으로 확정되지 않습니다.
        결과 설명을 읽고 스스로 가장 깊이 공감되는 유형을 탐색해 보세요.
      </p>

      <div className="no-print flex flex-col gap-3 sm:flex-row">
        <button onClick={() => print()} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">보고서 인쇄 / PDF 저장</button>
        <button onClick={() => confirm('결과가 삭제됩니다. 다시 검사할까요?') && onRestart()} className="rounded-xl px-6 py-3 font-semibold ring-1 ring-stone-300 hover:bg-stone-100 dark:ring-stone-700 dark:hover:bg-stone-900">다시 검사하기</button>
      </div>
    </main>
  );
}

function flaggedText(session: Session): string {
  return Object.entries(session.flags ?? {})
    .map(([id, reasons]) => {
      const i = itemById.get(id);
      if (!i) return '';
      const x = session.answers[id];
      const text = i.kind === 'likert' ? i.text : `A: ${i.a.text} / B: ${i.b.text}`;
      const ans = x === undefined ? '미응답' : i.kind === 'likert' ? LIKERT_LABELS[x - 1] : FC_LABELS[x - 1];
      return `[${id}] ${text}\n  이유: ${reasons.join(', ')}\n  내 응답: ${ans}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function FlaggedItems({ session }: { session: Session }) {
  const entries = Object.keys(session.flags ?? {});
  const [copied, setCopied] = useState(false);
  if (!entries.length) return null;
  const text = `에니어그램 검사 문항 피드백 (문항 은행 ${session.version}, ${entries.length}개)\n\n${flaggedText(session)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
  };
  return (
    <Section title={`표시한 문항 (${entries.length})`}>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-xs leading-relaxed dark:bg-stone-800">{flaggedText(session)}</pre>
      <button onClick={copy} className="no-print mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
        {copied ? '복사됨 ✓' : '피드백 전체 복사'}
      </button>
    </Section>
  );
}
