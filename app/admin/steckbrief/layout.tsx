import { TabNav } from "@/components/ui/TabNav";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Steckbrief</h1>
      </div>
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
