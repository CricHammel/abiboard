import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Abibuch</h1>
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
            <h1 className="text-2xl font-bold text-gray-900">Abibuch</h1>
            <p className="text-sm text-gray-600 mt-1">
              {session.user.firstName} {session.user.lastName}
            </p>
          </div>

          <nav className="px-4 space-y-1">
            <Link
              href="/dashboard"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/steckbrief"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Mein Steckbrief
            </Link>
            <Link
              href="/einstellungen"
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
            href="/dashboard"
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
            href="/steckbrief"
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1">Profil</span>
          </Link>
          <Link
            href="/einstellungen"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs mt-1">Einstellungen</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
