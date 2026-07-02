import { AccountSetupRequired } from "@/components/account-setup-required";
import { PortalLoading } from "@/components/portal-loading";
import type { PortalId } from "@/lib/auth/portal-access";

export function PersonaGuardBoundary({
  isReady,
  setupMessage,
  portalLabel,
  children,
}: {
  portal: PortalId;
  isReady: boolean;
  setupMessage: string | null;
  portalLabel: string;
  children: React.ReactNode;
}) {
  if (!isReady) {
    return <PortalLoading label={`Loading ${portalLabel} portal...`} />;
  }

  if (setupMessage) {
    return (
      <AccountSetupRequired portalLabel={portalLabel} message={setupMessage} />
    );
  }

  return children;
}
