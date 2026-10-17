import { useCallback, useEffect, useRef, useState } from 'react';
import { itemById } from '../../items/index';
import { FC_LABELS, LIKERT_LABELS } from '../../items/schema';
import { answer, back, expectedTotal, type Session } from '../../engine/session';

interface Props { session: Session; onChange: (s: Session) => void; onDone: () => void; onExit: () => void }

const PHASE_NAMES = { 1: '1단계 · 선별', 2: '2단계 · 변별', 3: '3단계 · 마무리', done: '완료' } as const;
const MAX_MS = 10 * 60 * 1000;

export function Test({ session, onChange, onDone, onExit }: Props) {
  const id = session.queue[session.index];
  const item = id ? itemById.get(id) : undefined;
  const shownAt = useRef(performance.now());
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    shownAt.current = performance.now();
    setPicked(null);
  }, [id]);

  useEffect(() => {
    if (session.phase === 'done') onDone();
  }, [session.phase, onDone]);

  const choose = useCallback(
    (v: number) => {
      if (!item || picked !== null) return;
      setPicked(v);
      const ms = performance.now() - shownAt.current;
      setTimeout(() => {
        const next = answer(session, item.id, v, ms < MAX_MS ? ms : 0);
        if (ms >= MAX_MS) delete next.times[item.id];
        onChange(next);
      }, 150);
    },
    [item, picked, session, onChange],
  );

  const goBack = useCallback(() => session.index > 0 && onChange(back(session)), [session, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const max = item?.kind === 'fc' ? 4 : 5;
      if (n >= 1 && n <= max) choose(n);
      else if (e.key === 'Backspace') { e.preventDefault(); goBack(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [choose, goBack, item]);

  if (!item) return null;
  const total = expectedTotal(session);
  const pct = Math.round((session.index / total) * 100);
  const prev = session.answers[item.id];
  const sel = picked ?? prev;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header>
        <div className="flex items-center justify-between text-sm text-stone-500">
          <button onClick={onExit} className="hover:text-stone-800 dark:hover:text-stone-200">← 나가기</button>
          <span>{PHASE_NAMES[session.phase]}</span>
          <span className="tabular-nums">{session.index + 1} / {total}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        {item.kind === 'likert' ? (
          <>
            <p className="text-center text-xl font-medium leading-relaxed sm:text-2xl">{item.text}</p>
            <div className="mt-10 grid grid-cols-5 gap-2">
              {LIKERT_LABELS.map((label, k) => (
                <button
                  key={label}
                  onClick={() => choose(k + 1)}
                  className={`flex flex-col items-center gap-2 rounded-xl px-1 py-4 text-xs ring-1 transition sm:text-sm ${
                    sel === k + 1
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-stone-200 hover:ring-indigo-400 dark:bg-stone-900 dark:ring-stone-800'
                  }`}
                >
                  <span className="text-lg font-semibold">{k + 1}</span>
                  <span className="leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-stone-500">두 문장 중 평소의 나와 더 가까운 쪽을 고르세요.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(['a', 'b'] as const).map((side) => (
                <div key={side} className="rounded-xl bg-white p-5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{side.toUpperCase()}</span>
                  <p className="mt-1 text-lg leading-relaxed">{item[side].text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {FC_LABELS.map((label, k) => (
                <button
                  key={label}
                  onClick={() => choose(k + 1)}
                  className={`rounded-xl px-1 py-4 text-xs ring-1 transition sm:text-sm ${
                    sel === k + 1
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-stone-200 hover:ring-indigo-400 dark:bg-stone-900 dark:ring-stone-800'
                  }`}
                >
                  <span className="block text-lg font-semibold">{k + 1}</span>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="flex justify-between text-sm">
        <button onClick={goBack} disabled={session.index === 0} className="text-stone-500 hover:text-stone-800 disabled:opacity-30 dark:hover:text-stone-200">
          ← 이전
        </button>
        <span className="text-stone-400">숫자 키로 응답</span>
      </footer>
    </main>
  );
}
