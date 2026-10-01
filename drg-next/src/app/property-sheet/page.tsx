import { Suspense } from "react";
import { PropertySheetCompatibilityClient } from "@/components/property-sheet/PropertySheetCompatibilityClient";
export default function PropertySheetCompatibilityPage(){return <Suspense fallback={<div className="drg-sheet-state">Preparando ficha técnica…</div>}><PropertySheetCompatibilityClient/></Suspense>;}
