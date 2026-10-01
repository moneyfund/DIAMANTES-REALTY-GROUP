import assert from "node:assert/strict";
import test from "node:test";

test("write gate is intentionally preview-only by source contract", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../src/lib/config/writes.ts", import.meta.url), "utf8")
  );
  assert.match(source, /drgDeploymentEnvironment === "preview"/);
  assert.match(source, /NEXT_PUBLIC_DRG_ALLOW_WRITES === "true"/);
  assert.match(source, /drgDataMode === "staging"/);
  assert.doesNotMatch(source, /drgDataMode === "production"/);
});
