import assert from "assert";
import { normalizeExpiry, validateExpiryDate } from "../validation";

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

// Valid entries
test("normalize MM/YY", () => {
  assert.strictEqual(normalizeExpiry("06/28"), "06/28");
});

test("normalize M/YY", () => {
  assert.strictEqual(normalizeExpiry("6/28"), "06/28");
});

test("normalize MM-YY", () => {
  assert.strictEqual(normalizeExpiry("06-28"), "06/28");
});

test("normalize MMYY", () => {
  assert.strictEqual(normalizeExpiry("0628"), "06/28");
});

test("normalize with spaces", () => {
  assert.strictEqual(normalizeExpiry(" 06 / 28 "), "06/28");
});

// Validation should accept canonical formats and future dates
test("validate future date", () => {
  assert.strictEqual(validateExpiryDate("06/28"), true);
});

// Edge cases
test("reject invalid month 13", () => {
  assert.strictEqual(normalizeExpiry("13/28"), null);
});

test("reject month 00", () => {
  assert.strictEqual(normalizeExpiry("00/28"), null);
});

test("reject expired date (if past) - may vary by current date", () => {
  // Build a past date dynamically: previous year same month
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyPast = String((now.getFullYear() - 1) % 100).padStart(2, "0");
  const exp = `${mm}/${yyPast}`;
  assert.strictEqual(validateExpiryDate(exp), false);
});

console.log("Expiry tests finished");