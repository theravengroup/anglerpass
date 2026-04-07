import { getActiveImpersonation } from "@/lib/admin/actions/impersonation";
import ImpersonationBanner from "./ImpersonationBanner";

/**
 * Server component that checks for an active impersonation session
 * and wraps children in the ImpersonationBanner if one is active.
 *
 * Rendered in the root layout so the banner appears on every page.
 */
export default async function ImpersonationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveImpersonation();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <ImpersonationBanner
      targetEmail={session.targetUserEmail}
      targetName={session.targetUserName}
      targetRole={session.targetRole}
    >
      {children}
    </ImpersonationBanner>
  );
}
