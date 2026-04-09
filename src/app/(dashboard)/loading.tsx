import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
      <Loader2 className="size-6 animate-spin text-river" />
    </div>
  );
}
