import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Match all paths except static files, api routes, and Next.js internals
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico).*)"],
};
