import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/steckbrief/uebersicht", label: "Übersicht" },
  { href: "/admin/steckbrief/felder", label: "Felder" },
];

export default function SteckbriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Steckbrief" className="mb-6" />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
