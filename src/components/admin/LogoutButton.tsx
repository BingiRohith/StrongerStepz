"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
      {loggingOut ? "Signing out…" : "Logout"}
    </Button>
  );
}
