import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { StudentNav } from "@/components/navigation/StudentNav";

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

          <StudentNav variant="desktop" />

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

      <StudentNav variant="mobile" />
    </div>
  );
}
