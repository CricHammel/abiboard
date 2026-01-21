"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    href: "/admin/steckbriefe",
    label: "Steckbriefe prüfen",
    mobileLabel: "Prüfen",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    href: "/admin/steckbrief-felder",
    label: "Steckbrief-Felder",
    mobileLabel: "Felder",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    href: "/admin/schueler",
    label: "Schülerverwaltung",
    mobileLabel: "Schüler",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    href: "/admin/einstellungen",
    label: "Einstellungen",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
];

// Items shown directly in mobile bottom nav (first 3)
const mobileMainItems = navItems.slice(0, 3);
// Items shown in "More" menu on mobile (rest)
const mobileMoreItems = navItems.slice(3);

export function AdminNav({ variant = "both" }: { variant?: "desktop" | "mobile" | "both" }) {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if any "more" item is active
  const isMoreItemActive = mobileMoreItems.some(
    (item) => pathname.startsWith(item.href)
  );

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreMenuOpen]);

  // Close menu on navigation
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Navigation */}
      {(variant === "desktop" || variant === "both") && (
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) &&
              (item.href === "/admin/dashboard" ? pathname === item.href : true);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Mobile Bottom Navigation */}
      {(variant === "mobile" || variant === "both") && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex justify-around py-2">
            {mobileMainItems.map((item) => {
              const isActive = pathname.startsWith(item.href) &&
                (item.href === "/admin/dashboard" ? pathname === item.href : true);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 min-w-[60px] transition-colors ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">
                    {item.mobileLabel || item.label}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex flex-col items-center py-2 px-3 min-w-[60px] transition-colors ${
                  isMoreItemActive || moreMenuOpen ? "text-primary" : "text-gray-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
                <span className="text-xs mt-1">Mehr</span>
              </button>

              {/* Popup Menu */}
              {moreMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px]">
                  {mobileMoreItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          isActive
                            ? "bg-primary-light text-primary"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Logout Button */}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-sm">Abmelden</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
