import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokens';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
};

async function parseError(res: Response): Promise<ApiError> {
  let detail = res.statusText || 'Error de red';
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') detail = data.detail;
    else if (Array.isArray(data?.detail)) detail = data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ') || detail;
  } catch {
    // ignore
  }
  return new ApiError(res.status, detail);
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) {
          clearTokens();
          return false;
        }
        const data = await res.json() as { access_token: string; refresh_token: string };
        setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        clearTokens();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, skipRefresh = false, headers, ...rest } = options;

  const reqHeaders = new Headers(headers);
  if (body !== undefined) reqHeaders.set('Content-Type', 'application/json');

  if (auth) {
    const token = getAccessToken();
    if (token) reqHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !skipRefresh) {
    const ok = await tryRefresh();
    if (ok) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    clearTokens();
    throw new ApiError(401, 'Sesión expirada. Vuelve a iniciar sesión.');
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { API_BASE };
