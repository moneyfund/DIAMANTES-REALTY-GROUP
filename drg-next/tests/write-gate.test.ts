import assert from "node:assert/strict";
import test from "node:test";

test("write gate accepts only migration preview or production main", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../src/lib/config/writes.ts", import.meta.url), "utf8")
  );

  assert.match(source, /drgDeploymentEnvironment === "preview"/);
  assert.match(source, /drgDeploymentBranch === "migration\/drg-next"/);
  assert.match(source, /drgDataMode === "staging"/);

  assert.match(source, /drgDeploymentEnvironment === "production"/);
  assert.match(source, /drgDeploymentBranch === "main"/);
  assert.match(source, /drgDataMode === "production"/);

  assert.match(source, /NEXT_PUBLIC_DRG_ALLOW_WRITES === "true"/);
});

test("Next config derives data mode from Vercel environment and branch", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../next.config.ts", import.meta.url), "utf8")
  );

  assert.match(source, /migrationWritePreview/);
  assert.match(source, /productionWriteDeployment/);
  assert.match(source, /deploymentEnvironment === "production"/);
  assert.match(source, /deploymentBranch === "main"/);
  assert.match(source, /\? "production"/);
});
