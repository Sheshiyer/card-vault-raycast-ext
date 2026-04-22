import assert from "assert";
import { addCard, getStoredCards, importCardsFromJSON, clearStoredCards } from "../utils";

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

async function reset() {
  await clearStoredCards();
}

test("CVV is never persisted and PAN is present", async () => {
  await reset();
  await addCard({
    bankName: "Test Bank",
    cardName: "Test",
    cardHolderName: "Alice",
    cardNumber: "4111111111111111",
    expiryDate: "06/28",
    cvv: "123",
    cardType: "credit",
    totalLimit: 50000,
  } as any);
  const cards = await getStoredCards();
  const card = cards[0];
  assert.ok(card);
  assert.strictEqual((card as any).cvv, undefined);
  assert.ok(card.cardNumber);
});

test("import drops CVV fields from payloads", async () => {
  await reset();
  const payload = JSON.stringify([
    {
      id: "x",
      bankName: "Import Bank",
      cardName: "Imported",
      cardHolderName: "Bob",
      cardNumber: "4000000000000002",
      expiryDate: "12/30",
      cvv: "999",
      cardType: "credit",
      totalLimit: 100000,
    },
  ]);
  const ok = await importCardsFromJSON(payload);
  assert.strictEqual(ok, true);
  const cards = await getStoredCards();
  const card = cards[0];
  assert.strictEqual((card as any).cvv, undefined);
});

console.log("Storage security tests finished");