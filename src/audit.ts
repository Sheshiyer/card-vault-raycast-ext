// Storage adapter with Raycast LocalStorage or Node test fallback
type StorageLike = {
  getItem<T>(key: string): Promise<T | null>;
  setItem(key: string, value: string): Promise<void>;
};

const memoryStorage: StorageLike = {
  // simple in-memory map for tests
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

const AUDIT_LOG_KEY = "audit_log";

export type AuditEvent = {
  timestamp: string;
  type: string;
  details?: Record<string, unknown>;
};

export function maskPAN(cardNumber: string): string {
  const digits = (cardNumber || "").replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `••••••••••••${last4}`;
}

export async function logAuditEvent(type: string, details?: Record<string, unknown>): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry: AuditEvent = { timestamp, type, details };
  const existing = await Storage.getItem<string>(AUDIT_LOG_KEY);
  const arr = existing ? (JSON.parse(existing) as AuditEvent[]) : [];
  arr.push(entry);
  await Storage.setItem(AUDIT_LOG_KEY, JSON.stringify(arr));
}

export async function getAuditLog(): Promise<AuditEvent[]> {
  const existing = await Storage.getItem<string>(AUDIT_LOG_KEY);
  return existing ? (JSON.parse(existing) as AuditEvent[]) : [];
}

export async function clearAuditLog(): Promise<void> {
  await Storage.setItem(AUDIT_LOG_KEY, JSON.stringify([]));
}