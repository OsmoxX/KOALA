import { NextRequest, NextResponse } from "next/server";

// Komunikacja serwera Next.js z backendem NestJS

export async function forwardToNest(
  request: NextRequest,
  backendPath: string,
  token?: string,
): Promise<NextResponse> {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, "");

  // Sprawdzanie źródła żądania
  const origin = request.headers.get("origin");

  if (
    request.method !== "GET" &&
    origin &&
    origin !== request.nextUrl.origin
  ) {
    return NextResponse.json(
      { message: "Nieprawidłowe źródło żądania." },
      { status: 403 },
    );
  }

  if (!base) {
    return NextResponse.json(
      { message: "Brak BACKEND_API_URL w pliku .env.local." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${base}${backendPath}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body:
        request.method === "GET"
          ? undefined
          : await request.text(),
      cache: "no-store",
    });

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const raw = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(raw);
    } catch {
      data = {
        message: response.ok
          ? "OK"
          : "Błąd odpowiedzi backendu.",
      };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message: "Nie można połączyć się z backendem NestJS.",
      },
      { status: 502 },
    );
  }
}