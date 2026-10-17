import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { scoreAll, TYPES } from '../engine/scoring';
import { newSession } from '../engine/session';
import { makePersona, runPersona } from '../engine/simulate';
import { Intro } from './screens/Intro';
import { Result } from './screens/Result';
import { Test } from './screens/Test';

const noop = () => {};

describe('screens render', () => {
  it('intro and test', () => {
    expect(renderToString(<Intro saved={null} onStart={noop} onResume={noop} />)).toContain('검사 시작');
    const s = newSession(1);
    expect(renderToString(<Test session={s} onChange={noop} onDone={noop} onExit={noop} />)).toContain('1단계');
  });

  it.each(TYPES)('result report for type %i', (t) => {
    const s = runPersona(makePersona(t, t), t);
    const html = renderToString(<Result session={s} onRestart={noop} />);
    expect(html).toContain(`${scoreAll(s.answers).main}번`);
    expect(html).toContain('응답 타당도');
  });

  it('result report for random responder shows caution', () => {
    const s = runPersona(makePersona(null, 9), 9);
    expect(renderToString(<Result session={s} onRestart={noop} />)).toContain('해석 주의');
  });
});
