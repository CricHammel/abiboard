import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Only admins can access admin routes
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">
            Abibuch Admin
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {session.user.firstName}
            </span>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen fixed">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Abibuch
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {session.user.firstName} {session.user.lastName}
            </p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary-light text-primary rounded">
              Admin
            </span>
          </div>

          <nav className="px-4 space-y-1">
            <Link
              href="/admin/dashboard"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/steckbriefe"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Steckbriefe prüfen
            </Link>
            <Link
              href="/admin/benutzer"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Benutzer verwalten
            </Link>
            <Link
              href="/admin/einstellungen"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Einstellungen
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <LogoutButton variant="secondary" className="w-full" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link
            href="/admin/dashboard"
            className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-primary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          <Link
            href="/admin/steckbriefe"
            className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-primary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs mt-1">Prüfen</span>
          </Link>
          <Link
            href="/admin/benutzer"
            className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-primary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-xs mt-1">Benutzer</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
