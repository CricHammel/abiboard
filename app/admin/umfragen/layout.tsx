import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/umfragen/uebersicht", label: "Übersicht" },
  { href: "/admin/umfragen/auswertung", label: "Auswertung" },
];

export default function UmfragenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Umfragen" className="mb-6" />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
