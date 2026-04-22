// Storage adapter with Raycast LocalStorage or Node test fallback
type StorageLike = {
  getItem<T>(key: string): Promise<T | null>;
  setItem(key: string, value: string): Promise<void>;
};

const memoryStorage: StorageLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _map: new Map<string, string>() as any,
  async getItem<T>(key: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (this as any)._map.get(key);
    return (v ?? null) as unknown as T | null;
  },
  async setItem(key: string, value: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._map.set(key, value);
  },
};

function getStorage(): StorageLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raycast = require("@raycast/api");
    return raycast.LocalStorage as StorageLike;
  } catch {
    return memoryStorage;
  }
}

const Storage = getStorage();
import { Card, CardFormData } from "./types";
import crypto from "crypto";
import type { RemoteSummary } from "./cloudflare";
import { logAuditEvent } from "./audit";

const CARDS_KEY = "stored_cards";
const BACKUP_KEY = "cards_backup";
const SCHEMA_VERSION_KEY = "schema_version";
const CURRENT_SCHEMA_VERSION = "3";
const ENCRYPTION_KEY_STORAGE_KEY = "encryption_key";
const LOCK_KEY = "cards_lock";
const LOCK_TTL_MS = 5000;

type EncryptedPayload = {
  iv: string; // base64
  data: string; // base64 ciphertext
  tag: string; // base64 auth tag
};

function getOrCreateEncryptionKey(): Promise<Buffer> {
  return (async () => {
    let key = await Storage.getItem<string>(ENCRYPTION_KEY_STORAGE_KEY);
    if (!key) {
      const newKey = crypto.randomBytes(32).toString("base64");
      await Storage.setItem(ENCRYPTION_KEY_STORAGE_KEY, newKey);
      key = newKey;
    }
    return Buffer.from(key, "base64");
  })();
}

async function encryptString(plain: string): Promise<EncryptedPayload> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  };
}

async function decryptString(payload: EncryptedPayload): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return (
    !!value &&
    typeof value === "object" &&
    "iv" in value && "data" in value && "tag" in value
  );
}

export async function initializeStorageSchema(): Promise<void> {
  const version = await Storage.getItem<string>(SCHEMA_VERSION_KEY);
  if (version === CURRENT_SCHEMA_VERSION) return;
  // Migrate in place without clearing data; add new fields with safe defaults.
  const storedData = await Storage.getItem<string>(CARDS_KEY);
  if (storedData) {
    try {
      const cards = JSON.parse(storedData) as any[];
      const migrated = cards.map((c) => {
        const next: any = { ...c };
        if (next.history == null) {
          const now = new Date().toISOString();
          next.history = [
            {
              timestamp: now,
              currentBalance: Number(next.currentBalance) || 0,
              pendingBalance: Number(next.pendingBalance) || 0,
              availableBalance:
                next.totalLimit != null
                  ? Math.max(0, Number(next.totalLimit) - (Number(next.currentBalance) || 0) - (Number(next.pendingBalance) || 0))
                  : undefined,
            },
          ];
        }
        // Preserve existing data; ensure fields exist for new version
        if (next.paymentDueDate == null) next.paymentDueDate = undefined;
        if (next.paymentDueAmount == null) next.paymentDueAmount = undefined;
        return next;
      });
      await LocalStorage.setItem(CARDS_KEY, JSON.stringify(migrated));
    } catch (e) {
      console.warn("schema migration: failed to parse existing data", e);
    }
  }
  await Storage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
}

export async function getStoredCards(): Promise<Card[]> {
  const storedData = await Storage.getItem<string>(CARDS_KEY);
  if (!storedData) return [];
  const raw = JSON.parse(storedData) as Card[];
  // Decrypt sensitive fields when present
  const decrypted = await Promise.all(
    raw.map(async (card: any) => {
      const clone: any = { ...card };
      if (isEncryptedPayload(clone.cardNumber)) {
        clone.cardNumber = await decryptString(clone.cardNumber);
      }
      return clone as Card;
    })
  );
  return decrypted;
}

export async function addCard(cardData: CardFormData): Promise<void> {
  await acquireLock();
  const now = new Date().toISOString();
  try {
    await backupCards();
    const cards = await getStoredCards();
    // Deduplication: if a card with same plaintext number exists, update instead of adding
    const existing = cards.find((c) => c.cardNumber.replace(/\s+/g, "") === cardData.cardNumber.replace(/\s+/g, ""));
    const encryptedCardNumber = await encryptString(cardData.cardNumber);
    if (existing) {
      const updated = cards.map((c) => {
        if (c.id === existing.id) {
          const next: any = {
            ...c,
            ...cardData,
            cardNumber: encryptedCardNumber,
            lastUpdated: now,
          };
          delete next.cvv; // never persist CVV
          return next;
        }
        return c as any;
      });
      await Storage.setItem(CARDS_KEY, JSON.stringify(updated.map(sanitizeForStorage)));
      await logAuditEvent("card_update_dedup", { id: existing.id });
      return;
    }
    const newCard: any = {
      ...cardData,
      cardNumber: encryptedCardNumber, // store encrypted
      id: crypto.randomUUID(),
      lastUpdated: now,
      history: [
        {
          timestamp: now,
          currentBalance: Number(cardData.currentBalance) || 0,
          pendingBalance: Number(cardData.pendingBalance) || 0,
          availableBalance:
            cardData.totalLimit != null
              ? Math.max(0, Number(cardData.totalLimit) - (Number(cardData.currentBalance) || 0) - (Number(cardData.pendingBalance) || 0))
              : undefined,
        },
      ],
    };
    delete newCard.cvv; // never persist CVV
    await Storage.setItem(CARDS_KEY, JSON.stringify([...
      cards.map(sanitizeForStorage),
      newCard,
    ]));
    await logAuditEvent("card_add", { id: newCard.id });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("card_add_rollback", { error: String(e) });
    throw e;
  } finally {
    await releaseLock();
  }
}

export async function editCard(id: string, cardData: CardFormData): Promise<void> {
  await acquireLock();
  try {
    await backupCards();
    const cards = await getStoredCards();
    const encryptedCardNumber = await encryptString(cardData.cardNumber);
    const now = new Date().toISOString();
    const updatedCards = cards.map((card) => {
      if (card.id === id) {
        const updated: any = {
          ...cardData,
          cardNumber: encryptedCardNumber,
          id,
          lastUpdated: now,
          history: [
            ...(card.history || []),
            {
              timestamp: now,
              currentBalance: Number(cardData.currentBalance) || 0,
              pendingBalance: Number(cardData.pendingBalance) || 0,
              availableBalance:
                cardData.totalLimit != null
                  ? Math.max(0, Number(cardData.totalLimit) - (Number(cardData.currentBalance) || 0) - (Number(cardData.pendingBalance) || 0))
                  : undefined,
            },
          ],
        };
        delete updated.cvv;
        return updated;
      }
      return sanitizeForStorage(card as any);
    });
    await Storage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
    await logAuditEvent("card_edit", { id });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("card_edit_rollback", { id, error: String(e) });
    throw e;
  } finally {
    await releaseLock();
  }
}

export async function removeCard(id: string): Promise<void> {
  await acquireLock();
  try {
    await backupCards();
    const cards = await getStoredCards();
    const filteredCards = cards.filter((card) => card.id !== id);
    await Storage.setItem(CARDS_KEY, JSON.stringify(filteredCards.map(sanitizeForStorage)));
    await logAuditEvent("card_remove", { id });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("card_remove_rollback", { id, error: String(e) });
    throw e;
  } finally {
    await releaseLock();
  }
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, "$1 ").trim();
}

export function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, "");
  return cleaned.length === 16;
}

export function normalizeExpiry(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  // Accept formats: MM/YY, M/YY, MM-YY, MM YY, MMYY, with optional spaces
  const cleaned = raw.replace(/\s+/g, "");
  let m: RegExpMatchArray | null = null;
  // MM/YY or M/YY
  m = raw.match(/^\s*(\d{1,2})\s*[\/-]?\s*(\d{2})\s*$/);
  if (!m) {
    console.warn(`[expiry] normalize failed: unexpected format`, { input });
    return null;
  }
  let mm = Number(m[1]);
  const yy = Number(m[2]);
  if (mm < 1 || mm > 12) {
    console.warn(`[expiry] month out of range`, { input, mm });
    return null;
  }
  const mmStr = mm < 10 ? `0${mm}` : String(mm);
  const yyStr = yy.toString().padStart(2, "0");
  return `${mmStr}/${yyStr}`;
}

export function validateExpiryDate(input: string): boolean {
  const canonical = normalizeExpiry(input);
  if (!canonical) {
    console.warn(`[expiry] validation failed: canonicalization returned null`, { input });
    return false;
  }
  const [mmStr, yyStr] = canonical.split("/");
  const month = Number(mmStr);
  const year2 = Number(yyStr);
  const now = new Date();
  // Consider card valid through the end of the month.
  const expiryEndOfMonth = new Date(2000 + year2, month, 0); // last day of month
  if (isNaN(expiryEndOfMonth.getTime())) {
    console.warn(`[expiry] invalid date constructed`, { canonical });
    return false;
  }
  const valid = expiryEndOfMonth >= new Date(now.getFullYear(), now.getMonth(), 1);
  if (!valid) {
    console.warn(`[expiry] expired card`, { canonical, now: now.toISOString() });
  }
  return valid;
}

export function validateCVV(cvv: string): boolean {
  const cleaned = cvv.replace(/\D/g, "");
  return cleaned.length === 3;
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export async function backupCards(): Promise<void> {
  const cards = await getStoredCards();
  await Storage.setItem(BACKUP_KEY, JSON.stringify(cards));
}

export async function restoreCardsFromBackup(): Promise<boolean> {
  const backupData = await Storage.getItem<string>(BACKUP_KEY);
  if (!backupData) return false;
  
  await Storage.setItem(CARDS_KEY, backupData);
  return true;
}

export async function exportCardsToJSON(): Promise<string> {
  const cards = await getStoredCards();
  return JSON.stringify(cards, null, 2);
}

export async function importCardsFromJSON(jsonData: string): Promise<boolean> {
  try {
    const cards = JSON.parse(jsonData);
    if (!Array.isArray(cards)) return false;
    
    // Sanitize and encrypt sensitive fields when importing
    const prepared = await Promise.all(
      cards.map(async (card: any) => {
        const encryptedCardNumber = isEncryptedPayload(card.cardNumber)
          ? card.cardNumber
          : await encryptString(String(card.cardNumber));
        const next: any = {
          ...card,
          cardNumber: encryptedCardNumber,
        };
        if (next.cvv !== undefined) delete next.cvv; // never persist CVV
        return next;
      })
    );
    await acquireLock();
    try {
      await backupCards();
      await Storage.setItem(CARDS_KEY, JSON.stringify(prepared.map(sanitizeForStorage)));
      await logAuditEvent("import_cards", { count: prepared.length });
      return true;
    } catch (e) {
      await restoreCardsFromBackup();
      await logAuditEvent("import_cards_rollback", { error: String(e) });
      return false;
    } finally {
      await releaseLock();
    }
  } catch (error) {
    return false;
  }
}

export async function updateAvailableBalance(cardId: string): Promise<void> {
  const cards = await getStoredCards();
  const now = new Date().toISOString();
  try {
    await backupCards();
    const updatedCards = cards.map((card) => {
      if (card.id === cardId && card.totalLimit) {
        const currentBalance = card.currentBalance || 0;
        const pendingBalance = card.pendingBalance || 0;
        const availableBalance = card.totalLimit - currentBalance - pendingBalance;
        return {
          ...card,
          availableBalance,
          lastUpdated: now,
          history: [
            ...(card.history || []),
            { timestamp: now, currentBalance, pendingBalance, availableBalance },
          ],
        };
      }
      return card;
    });
    await Storage.setItem(CARDS_KEY, JSON.stringify(updatedCards.map(sanitizeForStorage)));
    await logAuditEvent("balance_recompute", { cardId });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("balance_recompute_rollback", { cardId, error: String(e) });
    throw e;
  }
}

export async function mergeRemoteSummaries(summaries: RemoteSummary[]): Promise<void> {
  const cards = await getStoredCards();
  try {
    await backupCards();
    const updated = cards.map((card) => {
      const last4 = (card.cardNumber || "").slice(-4);
      const match = summaries.find((s) => s.bank === card.bankName && s.last4 === last4);
      if (!match) return card;
      const currentBalance = Number(match.balance || 0);
      const totalLimit = Number(match.credit_limit || card.totalLimit || 0);
      const pendingBalance = Number(card.pendingBalance || 0);
      const availableBalance = totalLimit - currentBalance - pendingBalance;
      return {
        ...card,
        currentBalance,
        totalLimit,
        availableBalance,
        lastUpdated: match.updated_at || new Date().toISOString(),
      };
    });
    await Storage.setItem(CARDS_KEY, JSON.stringify(updated.map(sanitizeForStorage)));
    await logAuditEvent("remote_merge", { mergedCount: summaries.length });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("remote_merge_rollback", { error: String(e) });
    throw e;
  }
}

export function calculateUtilization(totalLimit: number, used: number): number {
  if (!totalLimit || totalLimit <= 0) return 0;
  const raw = (Math.max(0, used) / totalLimit) * 100;
  const clamped = Math.min(100, Math.max(0, raw));
  return Number(clamped.toFixed(2));
}

export async function updateBalanceFromRemaining(
  cardId: string,
  remainingCredit: number,
  amountToPay: number
): Promise<void> {
  const cards = await getStoredCards();
  const now = new Date().toISOString();
  try {
    await backupCards();
    const updated = cards.map((card) => {
      if (card.id === cardId && card.totalLimit) {
        const totalLimit = card.totalLimit;
        const used = Math.max(0, totalLimit - Math.max(0, remainingCredit));
        const availableBalance = Math.max(0, totalLimit - used);
        return {
          ...card,
          currentBalance: used,
          pendingBalance: Math.max(0, amountToPay || 0),
          availableBalance,
          lastUpdated: now,
          history: [
            ...(card.history || []),
            {
              timestamp: now,
              currentBalance: used,
              pendingBalance: Math.max(0, amountToPay || 0),
              availableBalance,
            },
          ],
        };
      }
      return card;
    });
    await Storage.setItem(CARDS_KEY, JSON.stringify(updated.map(sanitizeForStorage)));
    await logAuditEvent("balance_update_from_remaining", { cardId, remainingCredit, amountToPay });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("balance_update_from_remaining_rollback", { cardId, error: String(e) });
    throw e;
  }
}

function sanitizeForStorage(card: any): any {
  // Ensure sensitive fields are encrypted and non-sensitive are plain
  const sanitized: any = { ...card };
  // Never persist CVV; remove if present
  if (sanitized.cvv !== undefined) delete sanitized.cvv;
  // If cardNumber is plain string, leave as-is (addCard/editCard handle encryption)
  return sanitized;
}

export async function bulkUpdateBalances(updates: Record<string, { currentBalance: number; pendingBalance: number }>): Promise<void> {
  await acquireLock();
  try {
    await backupCards();
    const cards = await getStoredCards();
    const updatedCards = cards.map((card) => {
      const update = updates[card.id];
      if (update) {
        const now = new Date().toISOString();
        const availableBalance = card.totalLimit
          ? Math.max(0, card.totalLimit - Math.max(0, update.currentBalance) - Math.max(0, update.pendingBalance))
          : undefined;

        const next = {
          ...card,
          currentBalance: Math.max(0, update.currentBalance || 0),
          pendingBalance: Math.max(0, update.pendingBalance || 0),
          availableBalance,
          lastUpdated: now,
          history: [
            ...(card.history || []),
            {
              timestamp: now,
              currentBalance: Math.max(0, update.currentBalance || 0),
              pendingBalance: Math.max(0, update.pendingBalance || 0),
              availableBalance,
            },
          ],
        };
        return next;
      }
      return card;
    });

    await Storage.setItem(CARDS_KEY, JSON.stringify(updatedCards.map(sanitizeForStorage)));
    await logAuditEvent("bulk_update_balances", { count: Object.keys(updates).length });
  } catch (e) {
    await restoreCardsFromBackup();
    await logAuditEvent("bulk_update_balances_rollback", { error: String(e) });
    throw e;
  } finally {
    await releaseLock();
  }
}
async function acquireLock(): Promise<void> {
  const start = Date.now();
  while (true) {
    const v = await Storage.getItem<string>(LOCK_KEY);
    const ts = v ? Number(v) : 0;
    const expired = !ts || Date.now() - ts > LOCK_TTL_MS;
    if (expired) {
      await Storage.setItem(LOCK_KEY, String(Date.now()));
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
    if (Date.now() - start > LOCK_TTL_MS * 2) throw new Error("Lock timeout");
  }
}

async function releaseLock(): Promise<void> {
  await Storage.setItem(LOCK_KEY, "0");
}

export async function clearStoredCards(): Promise<void> {
  await Storage.setItem(CARDS_KEY, JSON.stringify([]));
}
