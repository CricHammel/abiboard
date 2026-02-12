import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminZitateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Zitate" className="mb-6" />
      {children}
    </div>
  );
}
