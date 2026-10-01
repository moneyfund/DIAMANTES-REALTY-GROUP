import { readFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { isPublicProperty } from "../src/lib/properties/compat";
import { normalizeProperty } from "../src/lib/properties/normalize";

function extractConfig(source: string) {
  const read = (key: string) => {
    const match = source.match(new RegExp(key + "\\s*:\\s*['\"]([^'\"]+)['\"]"));
    return match?.[1] ?? "";
  };

  return {
    apiKey: read("apiKey"),
    authDomain: read("authDomain"),
    projectId: read("projectId"),
    storageBucket: read("storageBucket"),
    messagingSenderId: read("messagingSenderId"),
    appId: read("appId"),
    measurementId: read("measurementId")
  };
}

async function main() {
  const legacySource = await readFile("../js/firebase-client.js", "utf8");
  const firebaseConfig = extractConfig(legacySource);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error("Could not read the public Firebase web config from the legacy client.");
  }

  const app = initializeApp(firebaseConfig, "drg-readonly-parity");
  try {
    const db = getFirestore(app);
    const [snapshot, agentsSnapshot] = await Promise.all([
      getDocs(collection(db, "properties")),
      getDocs(collection(db, "agents"))
    ]);

    const rawDocs = snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data() as Record<string, unknown>
    }));

    const publicDocs = rawDocs.filter(({ data }) => isPublicProperty(data));
    const normalized = publicDocs.map(({ id, data }) => normalizeProperty(id, data));

    const diagnostics = {
      sourceCount: rawDocs.length,
      publicCount: normalized.length,
      withTitle: normalized.filter((p) => Boolean(p.title)).length,
      withPrice: normalized.filter((p) => typeof p.priceUsd === "number" && p.priceUsd > 0).length,
      withCoverImage: normalized.filter((p) => Boolean(p.coverImage)).length,
      withLocation: normalized.filter((p) => Boolean(p.location)).length,
      withType: normalized.filter((p) => Boolean(p.type)).length,
      withOperation: normalized.filter((p) => Boolean(p.operation)).length,
      missing: normalized
        .filter((p) => !p.title || !p.location || !p.type)
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          title: Boolean(p.title),
          location: Boolean(p.location),
          type: Boolean(p.type)
        }))
    };

    const agentDiagnostics = {
      sourceCount: agentsSnapshot.size,
      activeCount: agentsSnapshot.docs.filter((document) => {
        const data = document.data();
        return data.active !== false && String(data.status || "").toLowerCase() !== "inactive";
      }).length,
      withName: agentsSnapshot.docs.filter((document) => Boolean(String(document.data().name || "").trim())).length,
      withPhoto: agentsSnapshot.docs.filter((document) => {
        const data = document.data();
        return Boolean(data.photo || data.photoURL || data.photoUrl || data.profileImage || data.profilePhoto || data.avatar);
      }).length,
      withContact: agentsSnapshot.docs.filter((document) => {
        const data = document.data();
        return Boolean(data.phone || data.telefono || data.mobile || data.email || data.whatsapp || data.whatsApp);
      }).length
    };

    console.log(JSON.stringify({ properties: diagnostics, agents: agentDiagnostics }, null, 2));

    if (!rawDocs.length) throw new Error("Firestore returned zero property documents.");
    if (!normalized.length) throw new Error("No public properties matched DRG visibility rules.");
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error("[DRG readonly parity] failed:", error);
  process.exitCode = 1;
});
