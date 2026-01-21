"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  variant?: "primary" | "secondary" | "text";
  className?: string;
}

export function LogoutButton({
  variant = "text",
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <Button variant={variant} onClick={handleLogout} className={className}>
      Abmelden
    </Button>
  );
}
