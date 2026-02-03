"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LinkTab {
  href: string;
  label: string;
}

interface StateTab {
  id: string;
  label: string;
}

interface LinkTabNavProps {
  tabs: LinkTab[];
  activeTab?: never;
  onTabChange?: never;
}

interface StateTabNavProps {
  tabs: StateTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

type TabNavProps = LinkTabNavProps | StateTabNavProps;

export function TabNav(props: TabNavProps) {
  const pathname = usePathname();

  // State-based tabs (local state)
  if ("activeTab" in props && props.activeTab !== undefined) {
    const { tabs, activeTab, onTabChange } = props;
    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Link-based tabs (URL navigation)
  const { tabs } = props;
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-4 -mb-px overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
