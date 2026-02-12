import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/rankings/uebersicht", label: "Übersicht" },
  { href: "/admin/rankings/auswertung", label: "Auswertung" },
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
