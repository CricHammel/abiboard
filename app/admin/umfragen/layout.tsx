import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/umfragen/statistiken", label: "Statistiken" },
  { href: "/admin/umfragen/fragen", label: "Fragen" },
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
