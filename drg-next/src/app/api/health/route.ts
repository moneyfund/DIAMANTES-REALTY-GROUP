import { NextResponse } from "next/server";
import { drgDataMode, hasFirebasePublicConfig } from "@/lib/config/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "diamantes-realty-group-next",
    stage: 1,
    dataMode: drgDataMode,
    firebaseConfigured: hasFirebasePublicConfig()
  });
}
