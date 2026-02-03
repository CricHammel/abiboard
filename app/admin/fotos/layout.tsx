import { TabNav } from "@/components/ui/TabNav";

const tabs = [
  { href: "/admin/fotos/rubriken", label: "Rubriken" },
  { href: "/admin/fotos/uebersicht", label: "Übersicht" },
];

export default function FotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fotos</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
