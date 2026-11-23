export async function apiJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Serwer zwrócił nieprawidłową odpowiedź.");
    }
  }

  if (!response.ok) {
    const error = data as { message?: string | string[] } | null;
    const message = error?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(" ")
        : message || `Błąd żądania (HTTP ${response.status}).`,
    );
  }

  return data as T;
}