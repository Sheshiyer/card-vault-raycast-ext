import assert from "assert";
import { calculateUtilization } from "../validation";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test("returns 53.28% for 15451 outstanding / 29000 limit", () => {
  const pct = calculateUtilization(29000, 15451);
  assert.strictEqual(pct, 53.28);
});

test("clamps to 0% for zero or invalid limit", () => {
  assert.strictEqual(calculateUtilization(0, 1000), 0);
  assert.strictEqual(calculateUtilization(-100, 1000), 0);
});

test("handles zero outstanding as 0%", () => {
  assert.strictEqual(calculateUtilization(50000, 0), 0);
});

test("clamps to 100% when outstanding exceeds limit", () => {
  assert.strictEqual(calculateUtilization(29000, 35000), 100);
});

test("treats negative outstanding as 0%", () => {
  assert.strictEqual(calculateUtilization(29000, -100), 0);
});