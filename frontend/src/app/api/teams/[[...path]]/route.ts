import { NextRequest, NextResponse } from "next/server";
import { forwardToNest } from "@/lib/koala-server";

type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: NextRequest, context: Context) {
  const { path = [] } = await context.params;
  const method = request.method;
  const safeId = (value: string) => /^[A-Za-z0-9_-]{1,80}$/.test(value);

  // Dopuszczamy wyłącznie endpointy potrzebne interfejsowi.
  const allowed =
    (path.length === 0 && ["GET", "POST"].includes(method)) ||
    (path.length === 1 && path[0] === "categories" && method === "GET") ||
    (path.length === 1 && safeId(path[0]) && ["GET", "PATCH", "DELETE"].includes(method)) ||
    (path.length === 2 && safeId(path[0]) && path[1] === "students" && method === "POST") ||
    (path.length === 3 && safeId(path[0]) && path[1] === "students" && safeId(path[2]) && method === "DELETE");

  if (!allowed) {
    return NextResponse.json({ message: "Nieobsługiwana operacja." }, { status: 404 });
  }

  const token = request.cookies.get("koala_access_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Zaloguj się jako nauczyciel." }, { status: 401 });
  }

  return forwardToNest(request, `/teams${path.length ? `/${path.join("/")}` : ""}`, token);
}

export async function GET(request: NextRequest, context: Context) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return handle(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  return handle(request, context);
}