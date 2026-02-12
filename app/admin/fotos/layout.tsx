import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

const tabs = [
  { href: "/admin/fotos/uebersicht", label: "Übersicht" },
  { href: "/admin/fotos/galerie", label: "Fotos" },
];

export default function FotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Fotos" className="mb-6" />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
