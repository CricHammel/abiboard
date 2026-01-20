import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  basePath: "/abiboard/api/auth",  // ← NEU!
  pages: {
    signIn: "/abiboard/login",     // ← Geändert
    error: "/abiboard/login",       // ← Geändert
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes - mit basePath
      if (
        pathname === "/abiboard" ||
        pathname === "/abiboard/" ||
        pathname === "/abiboard/login" ||
        pathname === "/abiboard/register"
      ) {
        return true;
      }

      // Protected student routes
      if (
        pathname.startsWith("/abiboard/dashboard") ||
        pathname.startsWith("/abiboard/steckbrief") ||
        pathname.startsWith("/abiboard/einstellungen")
      ) {
        return isLoggedIn;
      }

      // Protected admin routes
      if (pathname.startsWith("/abiboard/admin")) {
        return isLoggedIn;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
