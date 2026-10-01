import { ArchitectureStatus } from "@/components/migration/ArchitectureStatus";
import { SiteShell } from "@/components/layout/SiteShell";

export default function Home() {
  return (
    <SiteShell>
      <ArchitectureStatus />
    </SiteShell>
  );
}
