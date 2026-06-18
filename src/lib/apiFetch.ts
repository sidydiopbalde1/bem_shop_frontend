/**
 * Wrapper fetch centralisé.
 *
 * - Injecte automatiquement le Bearer token.
 * - Sur 401 : tente un refresh silencieux.
 * - Si le refresh échoue (tokens expirés) : émet un event `bem:session-expired`
 *   que l'AuthProvider écoute pour afficher le bandeau.
 */

import { tokenStorage } from './auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function tryRefresh(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refresh}` },
    });
    if (!res.ok) return null;
    const { accessToken, refreshToken } = await res.json();
    tokenStorage.set(accessToken, refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

function dispatchSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bem:session-expired'));
  }
}

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const access = tokenStorage.getAccess();

  const headers = new Headers(init.headers ?? {});
  if (access) headers.set('Authorization', `Bearer ${access}`);

  const res = await fetch(input, { ...init, headers });

  // Pas de 401 → on retourne directement
  if (res.status !== 401) return res;

  // 401 → tentative de refresh silencieux
  const newAccess = await tryRefresh();
  if (!newAccess) {
    tokenStorage.clear();
    dispatchSessionExpired();
    return res; // retourne la réponse 401 originale
  }

  // Retry avec le nouveau token
  headers.set('Authorization', `Bearer ${newAccess}`);
  return fetch(input, { ...init, headers });
}
