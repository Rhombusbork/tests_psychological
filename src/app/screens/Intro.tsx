import type { Session } from '../../engine/session';

interface Props { saved: Session | null; onStart: () => void; onResume: () => void }

export function Intro({ saved, onStart, onResume }: Props) {
  const done = saved?.phase === 'done';
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <p className="text-sm font-medium tracking-wide text-indigo-600 dark:text-indigo-400">ENNEAGRAM ASSESSMENT</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">통합 에니어그램 검사</h1>
      <p className="mt-4 leading-relaxed text-stone-600 dark:text-stone-400">
        행동이 아닌 <b>동기</b>를 측정해 9가지 유형 중 당신의 핵심 유형을 찾습니다. 응답할 때마다 가장 헷갈리는 후보 유형을 가려낼 문항을 골라 내고, 충분히 확실해지면 일찍 끝나는 적응형 검사로,
        날개 · 본능 하위유형 · 트라이타입 · 센터 · 통합 수준까지 함께 분석합니다.
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[['약 190–250', '문항'], ['25–35분', '소요'], ['조기 종료', '적응형']].map(([v, l]) => (
          <div key={l} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
            <dt className="text-xl font-semibold">{v}</dt>
            <dd className="text-xs text-stone-500">{l}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-xl bg-white p-5 text-sm leading-relaxed shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
        <h2 className="font-semibold">정확한 결과를 위해</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600 dark:text-stone-400">
          <li>되고 싶은 모습이 아니라 <b>평소 실제 모습</b>으로 답하세요.</li>
          <li>최근 일시적인 상태보다 <b>오랫동안 반복된 패턴</b>을 떠올리세요. 직장과 사생활을 모두 아우른 모습을 기준으로 합니다.</li>
          <li>마지막 단계의 일부 문항은 <b>최근 한 달</b>의 상태를 묻습니다. 화면에 따로 표시됩니다.</li>
          <li>너무 오래 고민하지 말고 처음 떠오르는 답을 고르세요.</li>
          <li>진행 상황은 이 브라우저에 자동 저장됩니다. 중간에 닫아도 이어서 할 수 있습니다.</li>
          <li>키보드: 숫자 키로 응답, Backspace로 이전 문항.</li>
          <li>뜻이 모호하거나 답하기 어려운 문항은 아래 <b>⚑ 이 문항 이상해요</b>로 표시해 주세요. 결과 화면에서 모아서 복사할 수 있습니다.</li>
        </ul>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {saved && (
          <button onClick={onResume} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            {done ? '지난 결과 보기' : `이어서 하기 (${saved.index}문항 완료)`}
          </button>
        )}
        <button
          onClick={() => (!saved || confirm('저장된 진행 상황이 삭제됩니다. 새로 시작할까요?')) && onStart()}
          className={saved
            ? 'rounded-xl px-6 py-3 font-semibold ring-1 ring-stone-300 hover:bg-stone-100 dark:ring-stone-700 dark:hover:bg-stone-900'
            : 'rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700'}
        >
          {saved ? '처음부터 다시' : '검사 시작'}
        </button>
      </div>

      <p className="mt-10 text-xs text-stone-500">자기이해를 위한 비공식 검사이며, 임상적 진단을 대신하지 않습니다. 응답은 서버로 전송되지 않습니다.</p>
    </main>
  );
}
