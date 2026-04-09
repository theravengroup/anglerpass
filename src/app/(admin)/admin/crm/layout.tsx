import CrmNav from "@/components/admin/crm/CrmNav";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <CrmNav />
      {children}
    </div>
  );
}
