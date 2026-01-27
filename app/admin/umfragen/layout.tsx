import { TabNav } from "@/components/ui/TabNav";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Umfragen</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
