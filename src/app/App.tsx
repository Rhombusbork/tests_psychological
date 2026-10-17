import { lazy, Suspense, useEffect, useState } from 'react';
import { newSession, type Session } from '../engine/session';
import { Intro } from './screens/Intro';
import { Test } from './screens/Test';
import { loadSession, saveSession } from './storage';

const Result = lazy(() => import('./screens/Result').then((m) => ({ default: m.Result })));

type Route = 'intro' | 'test' | 'result';
const readRoute = (): Route => (location.hash === '#/test' ? 'test' : location.hash === '#/result' ? 'result' : 'intro');

export function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => saveSession(session), [session]);

  const go = (r: Route) => {
    location.hash = r === 'intro' ? '#/' : `#/${r}`;
    setRoute(r);
    scrollTo(0, 0);
  };

  // 경로와 상태가 맞지 않으면 바로잡는다
  const effective: Route =
    route === 'test' && !session ? 'intro' : route === 'result' && session?.phase !== 'done' ? (session ? 'test' : 'intro') : route;

  if (effective === 'test' && session)
    return <Test session={session} onChange={setSession} onDone={() => go('result')} onExit={() => go('intro')} />;
  if (effective === 'result' && session) return (
      <Suspense fallback={<p className="p-8 text-center text-stone-500">결과를 계산하는 중…</p>}>
        <Result session={session} onRestart={() => { setSession(null); go('intro'); }} />
      </Suspense>
    );
  return (
    <Intro
      saved={session}
      onStart={() => { setSession(newSession()); go('test'); }}
      onResume={() => go(session?.phase === 'done' ? 'result' : 'test')}
    />
  );
}
