import { NextRequest, NextResponse } from "next/server";
import { forwardToNest } from "@/lib/koala-server";

type Context = { params: Promise<{ action: string }> };

// Reset hasła: request (prośba o link), verify (sprawdzenie linku), confirm (nowe hasło).
const ACTIONS = new Set(["request", "verify", "confirm"]);

export async function POST(request: NextRequest, { params }: Context) {
  const { action } = await params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ message: "Nieznany endpoint." }, { status: 404 });
  }
  return forwardToNest(request, `/auth/password-reset/${action}`);
}
