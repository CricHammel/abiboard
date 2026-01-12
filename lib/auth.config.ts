import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register"
      ) {
        return true;
      }

      // Protected student routes (requires authentication)
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/steckbrief") ||
        pathname.startsWith("/einstellungen")
      ) {
        return isLoggedIn;
      }

      // Protected admin routes (requires authentication)
      // Note: Role check happens in the admin layout
      if (pathname.startsWith("/admin")) {
        return isLoggedIn;
      }

      return isLoggedIn;
    },
  },
  providers: [], // Providers will be added in auth.ts
} satisfies NextAuthConfig;
