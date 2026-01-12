"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  variant?: "primary" | "secondary" | "text";
  className?: string;
}

export function LogoutButton({
  variant = "text",
  className = "",
}: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button variant={variant} onClick={handleLogout} className={className}>
      Abmelden
    </Button>
  );
}
