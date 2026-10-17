import { itemById } from '../items/index';
import type { EnneaType, Instinct } from '../items/schema';
import { rng } from './rng';
import { neighbors, TYPES, INSTINCTS } from './scoring';
import { answer, newSession, type Session } from './session';

export interface Persona {
  type: EnneaType | null; // null = 무작위 응답자
  instinct: Instinct;
  latent: Record<number, number>;
  instLatent: Record<string, number>;
  bias: number;
  noise: number;
}

export const PROFILES = {
  standard: { main: 4.3, wing: 3.4, otherLo: 2.0, otherHi: 3.2, noise: 0.8 },
  hard: { main: 3.9, wing: 3.6, otherLo: 2.2, otherHi: 3.6, noise: 1.0 },
} as const;

export function makePersona(type: EnneaType | null, seed: number, profile: keyof typeof PROFILES = 'standard'): Persona {
  const r = rng(seed);
  const P = PROFILES[profile];
  const noise = P.noise;
  const latent: Record<number, number> = {};
  for (const t of TYPES) latent[t] = P.otherLo + r() * (P.otherHi - P.otherLo);
  if (type) {
    latent[type] = P.main;
    const [a, b] = neighbors(type);
    latent[r() < 0.5 ? a : b] = P.wing;
  }
  const instinct = INSTINCTS[Math.floor(r() * 3)];
  const instLatent: Record<string, number> = {};
  for (const n of INSTINCTS) instLatent[n] = n === instinct ? 4.2 : 2.3 + r() * 0.8;
  return { type, instinct, latent, instLatent, bias: (r() - 0.5), noise };
}

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function respond(p: Persona, id: string, r: () => number): number {
  const item = itemById.get(id)!;
  if (p.type === null) return item.kind === 'fc' ? 1 + Math.floor(r() * 4) : 1 + Math.floor(r() * 5);
  if (item.kind === 'fc') {
    const la = item.a.type ? p.latent[item.a.type] : p.instLatent[item.a.instinct!];
    const lb = item.b.type ? p.latent[item.b.type] : p.instLatent[item.b.instinct!];
    const pa = 1 / (1 + Math.exp(-2 * (la - lb) + gauss(r) * p.noise));
    return pa > 0.8 ? 1 : pa > 0.5 ? 2 : pa > 0.2 ? 3 : 4;
  }
  if (item.validity === 'attention') return item.expected!;
  if (item.validity === 'desirability') return clamp(Math.round(2 + gauss(r) * 0.8), 1, 5);
  let mu = 3;
  if (item.validity === 'consistency') mu = p.latent[Number(item.pairWith![1])];
  else if (item.type) mu = item.block === 'level' ? (item.level === 'healthy' ? 3.5 : 2.5) : p.latent[item.type];
  else if (item.instinct) mu = p.instLatent[item.instinct];
  const target = item.key === 1 ? mu : 6 - mu;
  return clamp(Math.round(target + p.bias + gauss(r) * p.noise), 1, 5);
}

export function runPersona(p: Persona, seed: number): Session {
  const r = rng(seed * 7 + 3);
  let s = newSession(seed);
  while (s.phase !== 'done') {
    const id = s.queue[s.index];
    s = answer(s, id, respond(p, id, r), p.type === null ? 400 + r() * 600 : 2500 + r() * 4000);
  }
  return s;
}
