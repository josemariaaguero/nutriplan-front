import { clearTokens, getAccessToken, setTokens } from './tokens';
import { supabase } from '../supabase';

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

function formatValidationDetail(items: Array<{ loc?: unknown[]; msg?: string; type?: string }>): string {
  const FIELD_LABELS: Record<string, string> = {
    height: 'altura (cm)',
    weight: 'peso (kg)',
    target_weight: 'peso objetivo (kg)',
    age: 'edad',
    name: 'nombre',
    sex: 'sexo',
    goals: 'objetivos',
    diet_type: 'tipo de dieta',
    activity_level: 'nivel de actividad',
  };

  const parts = items.map(d => {
    const loc = Array.isArray(d.loc) ? d.loc.map(String) : [];
    const fieldKey = [...loc].reverse().find(p => p in FIELD_LABELS) || loc[loc.length - 1];
    const label = (fieldKey && FIELD_LABELS[fieldKey]) || fieldKey || 'dato';
    const msg = (d.msg || '').toLowerCase();
    if (msg.includes('greater than or equal to 100') || (fieldKey === 'height' && msg.includes('greater than'))) {
      return `La ${label} debe ser al menos 100 cm (ej. 175).`;
    }
    if (msg.includes('less than or equal to 250') && fieldKey === 'height') {
      return `La ${label} debe ser como máximo 250 cm.`;
    }
    if (msg.includes('greater than or equal to 30') && (fieldKey === 'weight' || fieldKey === 'target_weight')) {
      return `El ${label} debe ser al menos 30 kg.`;
    }
    if (d.msg) return `${label}: ${d.msg}`;
    return null;
  }).filter(Boolean);

  return parts.join(' ') || 'Revisa los datos del formulario.';
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = res.statusText || 'Error de red';
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') detail = data.detail;
    else if (Array.isArray(data?.detail)) detail = formatValidationDetail(data.detail);
  } catch {
    // ignore
  }
  return new ApiError(res.status, detail);
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          clearTokens();
          return false;
        }
        setTokens(data.session.access_token, data.session.refresh_token);
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
