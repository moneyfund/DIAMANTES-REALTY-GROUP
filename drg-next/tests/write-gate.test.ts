import assert from "node:assert/strict";
import test from "node:test";

test("write gate is limited to the migration preview branch", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../src/lib/config/writes.ts", import.meta.url), "utf8")
  );

  assert.match(source, /drgDeploymentEnvironment === "preview"/);
  assert.match(source, /drgDeploymentBranch === "migration\/drg-next"/);
  assert.match(source, /NEXT_PUBLIC_DRG_ALLOW_WRITES === "true"/);
  assert.match(source, /drgDataMode === "staging"/);
});

test("Next config forces production writes off", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../next.config.ts", import.meta.url), "utf8")
  );

  assert.match(source, /deploymentEnvironment === "production"/);
  assert.match(source, /\? "false"/);
  assert.match(source, /migrationWritePreview/);
});
