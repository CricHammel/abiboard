import { TabNav } from "@/components/ui/TabNav";

const tabs = [
  { href: "/zitate/schueler", label: "Schüler" },
  { href: "/zitate/lehrer", label: "Lehrer" },
];

export default function ZitateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zitate</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
