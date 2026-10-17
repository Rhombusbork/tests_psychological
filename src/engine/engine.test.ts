import { describe, expect, it } from 'vitest';
import { coreItems, validityItems } from '../items/index';
import { buildPhase1 } from './order';
import { neighbors, scoreAll, scoreTypes } from './scoring';
import { answer, back, newSession } from './session';
import { makePersona, runPersona } from './simulate';
import { checkValidity } from './validity';

describe('order', () => {
  it('phase 1 contains every screening item exactly once and is seed-stable', () => {
    const a = buildPhase1(42);
    expect(new Set(a).size).toBe(a.length);
    expect(a.length).toBe(278);
    expect(buildPhase1(42)).toEqual(a);
    expect(buildPhase1(43)).not.toEqual(a);
  });

  it('never places more than 2 same-type core items in a row', () => {
    const ids = buildPhase1(7);
    const typeOf = (id: string) => (id.startsWith('T') ? id[1] : null);
    for (let i = 2; i < ids.length; i++) {
      const t = typeOf(ids[i]);
      if (t) expect(t === typeOf(ids[i - 1]) && t === typeOf(ids[i - 2])).toBe(false);
    }
  });
});

describe('scoring', () => {
  it('reverse keys and acquiescence correction make all-5 answers flat', () => {
    const all5 = Object.fromEntries(coreItems.map((i) => [i.id, 5]));
    const scores = scoreTypes(all5).map((r) => r.score);
    expect(Math.max(...scores) - Math.min(...scores)).toBeLessThan(1e-9);
  });

  it('identifies a clear type', () => {
    const a = Object.fromEntries(coreItems.map((i) => [i.id, i.type === 4 ? (i.key === 1 ? 5 : 1) : 3]));
    const r = scoreAll(a);
    expect(r.main).toBe(4);
    expect(neighbors(4)).toContain(r.wing.type);
    expect(r.tritype[0]).toBe(4);
    expect(r.tritype).toHaveLength(3);
  });

  it('neighbors wrap around the circle', () => {
    expect(neighbors(1)).toEqual([9, 2]);
    expect(neighbors(9)).toEqual([8, 1]);
  });
});

describe('session', () => {
  it('runs through all three phases', () => {
    const s = runPersona(makePersona(6, 1), 1);
    expect(s.phase).toBe('done');
    expect(s.phaseEnds).toHaveLength(3);
    expect(scoreAll(s.answers).main).toBe(6);
    expect(scoreAll(s.answers).level).not.toBeNull();
  });

  it('back keeps answers and allows re-answering', () => {
    let s = newSession(3);
    s = answer(s, s.queue[0], 4, 3000);
    s = back(s);
    expect(s.index).toBe(0);
    s = answer(s, s.queue[0], 2, 3000);
    expect(s.answers[s.queue[0]]).toBe(2);
    expect(s.index).toBe(1);
  });
});

describe('validity', () => {
  it('flags random responders but not careful ones', () => {
    const rnd = runPersona(makePersona(null, 5), 5);
    expect(checkValidity(rnd.answers, rnd.queue, rnd.times).caution).toBe(true);
    const ok = runPersona(makePersona(2, 5), 5);
    expect(checkValidity(ok.answers, ok.queue, ok.times).caution).toBe(false);
  });

  it('counts wrong attention answers', () => {
    const a = Object.fromEntries(validityItems.filter((v) => v.validity === 'attention').map((v) => [v.id, 3]));
    const c = checkValidity(a, Object.keys(a), {}).checks.find((x) => x.key === 'attention')!;
    expect(c.value).toBe(2);
  });
});
