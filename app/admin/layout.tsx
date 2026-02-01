import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AdminNav } from "@/components/navigation/AdminNav";

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
            AbiBoard Admin
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
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
          <div className="p-6 shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">
              AbiBoard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {session.user.firstName} {session.user.lastName}
            </p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary-light text-primary rounded">
              Admin
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <AdminNav variant="desktop" />
          </div>

          <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
            <LogoutButton variant="secondary" className="w-full" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64 flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <AdminNav variant="mobile" />
    </div>
  );
}
