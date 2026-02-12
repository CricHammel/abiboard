import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

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
      <PageHeader title="Rankings" className="mb-6" />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
