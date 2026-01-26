import { TabNav } from "@/components/ui/TabNav";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Zitate</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
