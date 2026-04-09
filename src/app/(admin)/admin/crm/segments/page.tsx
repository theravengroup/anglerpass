import { redirect } from "next/navigation";

// Segments are accessible via the Campaigns tab (segments sub-tab).
// This redirect ensures the CrmNav "Segments" link works cleanly.
export default function CrmSegmentsRedirect() {
  redirect("/admin/crm/campaigns");
}
