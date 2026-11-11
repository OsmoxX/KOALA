const API_URL = (
  process.env.BACKEND_API_URL ??
  'http://localhost:3000/api'
).replace(/\/+$/, '');

export interface BackendResult {
  ok: boolean;
  status: number;
  data: unknown;
}

export async function backendRequest(
  path: string,
  options: RequestInit
): Promise<BackendResult | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: 'no-store',
    });

    const data: unknown = await response
      .json()
      .catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return null;
  }
}

export function backendError(data: unknown) {
  const error =
    data !== null && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : {};

  const rawMessage = error.message;

  const message =
    typeof rawMessage === 'string'
      ? rawMessage
      : Array.isArray(rawMessage)
        ? rawMessage
            .filter(
              (item): item is string =>
                typeof item === 'string'
            )
            .join(', ')
        : 'Wystąpił błąd serwera.';

  return {
    message,
    code:
      typeof error.code === 'string'
        ? error.code
        : undefined,
  };
}