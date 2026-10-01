import { NextResponse } from "next/server";
import { drgDataMode, hasFirebasePublicConfig } from "@/lib/config/env";
import {
  drgDeploymentBranch,
  drgDeploymentEnvironment,
  drgWritesEnabled
} from "@/lib/config/writes";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "diamantes-realty-group-next",
    stage: 2,
    dataMode: drgDataMode,
    firebaseConfigured: hasFirebasePublicConfig(),
    writesEnabled: drgWritesEnabled,
    environment: drgDeploymentEnvironment,
    branch: drgDeploymentBranch
  });
}
