import { ITEM_BANK_VERSION } from '../items/version';
import type { Session } from '../engine/session';

const KEY = 'ennea.session.v1';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.version === ITEM_BANK_VERSION ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* 저장 실패해도 검사는 계속 */
  }
}
