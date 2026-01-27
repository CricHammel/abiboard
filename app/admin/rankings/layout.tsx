import { TabNav } from "@/components/ui/TabNav";

const tabs = [
  { href: "/admin/rankings/statistiken", label: "Statistiken" },
  { href: "/admin/rankings/fragen", label: "Fragen" },
];

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
