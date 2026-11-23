import { NextRequest, NextResponse } from "next/server";
import { forwardToNest } from "@/lib/koala-server";

type Context = { params: Promise<{ action: string }> };
const COOKIE_NAME = "koala_student_token";

export async function GET(request: NextRequest, { params }: Context) {
  const { action } = await params;
  if (action !== "me") {
    return NextResponse.json({ message: "Nieznany endpoint." }, { status: 404 });
  }
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Zaloguj się jako uczeń." }, { status: 401 });
  }
  return forwardToNest(request, "/students/me", token);
}

export async function POST(request: NextRequest, { params }: Context) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Nieprawidłowe źródło żądania." }, { status: 403 });
  }
  const { action } = await params;

  if (action === "logout") {
    const response = NextResponse.json({ message: "Wylogowano." });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (action === "login") {
    const response = await forwardToNest(request, "/auth/student/login");
    if (!response.ok) return response;

    const data = await response.json() as {
      accessToken?: string;
      mustChangePassword?: boolean;
    };
    if (!data.accessToken) {
      return NextResponse.json(
        { message: "Backend nie zwrócił tokenu JWT." },
        { status: 502 },
      );
    }

    if (typeof data.mustChangePassword !== "boolean") {
      return NextResponse.json({ message: "Backend nie zwrócił informacji o zmianie hasła." }, { status: 502 });
    }
    const result = NextResponse.json({ mustChangePassword: data.mustChangePassword }, {
      headers: { "Cache-Control": "no-store" },
    });
    result.cookies.set(COOKIE_NAME, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // Dostosować do czasu życia JWT ucznia w backendzie.
    });
    return result;
  }

  if (action === "password") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Zaloguj się jako uczeń." }, { status: 401 });
    }
    return forwardToNest(request, "/auth/student/change-password", token);
  }

  return NextResponse.json({ message: "Nieznany endpoint." }, { status: 404 });
}