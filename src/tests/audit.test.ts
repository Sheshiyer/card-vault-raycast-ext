import assert from "assert";
import { logAuditEvent, getAuditLog, clearAuditLog } from "../audit";

function test(name: string, fn: () => Promise<void> | void) {
  Promise.resolve()
    .then(() => fn())
    .then(() => console.log(`✓ ${name}`))
    .catch((e) => {
      console.error(`✗ ${name}`);
      console.error(e);
      process.exitCode = 1;
    });
}

test("audit log records events with details", async () => {
  await clearAuditLog();
  await logAuditEvent("test_event", { foo: "bar" });
  const log = await getAuditLog();
  assert.ok(Array.isArray(log));
  assert.ok(log.length >= 1);
  const last = log[log.length - 1];
  assert.strictEqual(last.type, "test_event");
  assert.strictEqual((last.details as any).foo, "bar");
});

console.log("Audit tests finished");