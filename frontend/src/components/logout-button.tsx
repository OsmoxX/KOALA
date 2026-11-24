"use client";

import { useState } from "react";
import { logoutTeacher } from "@/lib/auth-client";
import { apiJson } from "@/lib/koala-client";

type Props = {
  kind?: "teacher" | "student";
  className?: string;
  onError?: (message: string) => void;
};

export function LogoutButton({
  kind = "teacher",
  className,
  onError,
}: Props) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    onError?.("");

    try {
      if (kind === "student") {
        await apiJson<unknown>("/api/student/logout", {
          method: "POST",
          body: "{}",
        });
        window.location.assign("/student/login");
      } else {
        await logoutTeacher();
        window.location.assign("/login");
      }
    } catch {
      onError?.("Nie udało się wylogować.");
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={className}
    >
      {loggingOut ? "Wylogowywanie..." : "Wyloguj"}
    </button>
  );
}
