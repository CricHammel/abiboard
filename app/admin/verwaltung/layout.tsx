import { TabNav } from "@/components/ui/TabNav";

const tabs = [
  { href: "/admin/verwaltung/schueler", label: "Schüler" },
  { href: "/admin/verwaltung/lehrer", label: "Lehrer" },
];

export default function VerwaltungLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Verwaltung</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
