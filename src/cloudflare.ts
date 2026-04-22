import { Card } from "./types";
import { calculateUtilization } from "./utils";
import { showToast, Toast, getPreferenceValues } from "@raycast/api";

export type RemoteSummary = {
  card_alias: string;
  bank: string;
  last4: string;
  balance: number;
  credit_limit: number;
  utilization: number;
  currency: string;
  updated_at: string;
};

// Configure Worker base URL via Raycast preferences or env.
const prefs = getPreferenceValues<{ workerBaseUrl?: string }>();
const WORKER_BASE_URL = (prefs.workerBaseUrl ?? process.env.WORKER_BASE_URL ?? "").trim();

function requireBaseUrl(): string {
  if (!WORKER_BASE_URL) {
    throw new Error("Cloudflare Worker URL not configured (WORKER_BASE_URL)");
  }
  return WORKER_BASE_URL;
}

export async function fetchSummaries(): Promise<RemoteSummary[]> {
  const base = requireBaseUrl();
  const res = await fetch(`${base}/v1/summary`, { headers: { "cache-control": "no-store" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return (await res.json()) as RemoteSummary[];
}

export async function upsertFromCard(card: Card): Promise<boolean> {
  try {
    const base = requireBaseUrl();
    const last4 = (card.cardNumber || "").slice(-4);
    const currency = "INR";
    const balance = Number(card.currentBalance || 0);
    const creditLimit = Number(card.totalLimit || 0);
    const utilization = calculateUtilization(balance, creditLimit);
    const payload = {
      card_alias: `${card.bankName || ""}:${last4}`,
      bank: card.bankName || "",
      last4,
      balance,
      credit_limit: creditLimit,
      utilization,
      currency,
      updated_at: new Date().toISOString(),
    };
    const res = await fetch(`${base}/v1/summary/upsert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
    return true;
  } catch (e) {
    console.warn("Cloudflare upsertFromCard skipped:", e);
    await showToast({ style: Toast.Style.Animated, title: "Cloudflare upsert skipped", message: String(e) });
    return false;
  }
}