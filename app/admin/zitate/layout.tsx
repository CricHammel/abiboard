import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/zitate/schueler", label: "Schüler" },
  { href: "/admin/zitate/lehrer", label: "Lehrer" },
];

export default function AdminZitateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Zitate" className="mb-6" />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
