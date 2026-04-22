/// <reference types="@cloudflare/workers-types" />
// Fallback type declarations to satisfy TypeScript when workers types aren't installed locally.
interface D1PreparedStatement {
  bind(...args: any[]): { run(): Promise<any>; all(): Promise<{ results?: any[] }>; };
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
interface R2Bucket {
  put(key: string, value: string | ArrayBuffer | ReadableStream<any>, options?: any): Promise<any>;
}

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ARCHIVE?: R2Bucket;
  ALLOWED_IPS?: string;
}

function getClientIP(req: Request): string | null {
  // Cloudflare provides CF-Connecting-IP; otherwise check X-Forwarded-For
  const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("x-forwarded-for") || null;
  // If XFF has multiple, take first
  return ip ? ip.split(",")[0].trim() : null;
}

function isAllowed(req: Request, env: Env): boolean {
  const ip = getClientIP(req);
  if (!ip) return false;
  const allowlist = (env.ALLOWED_IPS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    // No allowlist set: treat as deny-all for safety
    return false;
  }
  return allowlist.includes(ip);
}

async function json<T>(data: T, status = 200): Promise<Response> {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

async function upsertSummary(req: Request, env: Env): Promise<Response> {
  if (!isAllowed(req, env)) {
    return json({ error: "Forbidden" }, 403);
  }
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const {
    card_alias,
    bank,
    last4,
    balance,
    limit,
    utilization,
    currency,
    updated_at,
  } = body as Record<string, unknown>;

  // Minimal validation for internal tool
  if (
    typeof card_alias !== "string" ||
    typeof bank !== "string" ||
    typeof last4 !== "string" ||
    typeof balance !== "number" ||
    typeof limit !== "number" ||
    typeof utilization !== "number" ||
    typeof currency !== "string"
  ) {
    return json({ error: "Missing or invalid fields" }, 400);
  }

  const updated = typeof updated_at === "string" ? updated_at : new Date().toISOString();

  // Write to summaries (upsert) and history (append)
  const upsertSQL = `INSERT INTO summaries (card_alias, bank, last4, balance, credit_limit, utilization, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(card_alias) DO UPDATE SET bank=excluded.bank, last4=excluded.last4, balance=excluded.balance,
      credit_limit=excluded.credit_limit, utilization=excluded.utilization, currency=excluded.currency, updated_at=excluded.updated_at`;

  const historySQL = `INSERT INTO history (card_alias, balance, credit_limit, utilization, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`;

  await env.DB.prepare(upsertSQL)
    .bind(card_alias, bank, last4, balance, limit as number, utilization, currency, updated)
    .run();

  await env.DB.prepare(historySQL)
    .bind(card_alias, balance, limit as number, utilization, currency, updated)
    .run();

  // Invalidate KV cache
  try { await env.CACHE.delete("summary:all"); } catch {}

  return json({ ok: true });
}

async function getSummaries(req: Request, env: Env): Promise<Response> {
  if (!isAllowed(req, env)) {
    return json({ error: "Forbidden" }, 403);
  }
  // Try KV cache first
  try {
    const cached = await env.CACHE.get("summary:all");
    if (cached) return new Response(cached, { status: 200, headers: { "content-type": "application/json" } });
  } catch {}

  const result = await env.DB.prepare(
    "SELECT card_alias, bank, last4, balance, credit_limit, utilization, currency, updated_at FROM summaries ORDER BY bank, last4"
  ).all();

  const payload = JSON.stringify(result.results || []);

  // Populate KV cache briefly
  try { await env.CACHE.put("summary:all", payload, { expirationTtl: 60 }); } catch {}

  return new Response(payload, { status: 200, headers: { "content-type": "application/json" } });
}

async function exportSummaries(req: Request, env: Env): Promise<Response> {
  if (!isAllowed(req, env)) {
    return json({ error: "Forbidden" }, 403);
  }
  const all = await env.DB.prepare(
    "SELECT card_alias, bank, last4, balance, credit_limit, utilization, currency, updated_at FROM summaries"
  ).all();

  const payload = JSON.stringify({ exported_at: new Date().toISOString(), summaries: all.results || [] });

  // If R2 bound, write an object
  if (env.ARCHIVE) {
    const key = `summaries-${Date.now()}.json`;
    await env.ARCHIVE.put(key, payload, { customMetadata: { contentType: "application/json" } });
  }

  return new Response(payload, { status: 200, headers: { "content-type": "application/json" } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/v1/summary/upsert" && req.method === "POST") {
      return upsertSummary(req, env);
    }
    if (url.pathname === "/v1/summary" && req.method === "GET") {
      return getSummaries(req, env);
    }
    if (url.pathname === "/v1/summary/export" && req.method === "GET") {
      return exportSummaries(req, env);
    }
    return json({ error: "Not Found" }, 404);
  },
};