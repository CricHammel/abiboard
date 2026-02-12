import { TabNav } from "@/components/ui/TabNav";
import { PageHeader } from "@/components/ui/PageHeader";

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
      <PageHeader
        title="Zitate"
        description="Sammle lustige Zitate von Mitschülern und Lehrern."
        className="mb-6"
      />
      <TabNav tabs={tabs} />
      {children}
    </div>
  );
}
