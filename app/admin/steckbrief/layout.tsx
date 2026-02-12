import { PageHeader } from "@/components/ui/PageHeader";

export default function SteckbriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Steckbrief" className="mb-6" />
      {children}
    </div>
  );
}
