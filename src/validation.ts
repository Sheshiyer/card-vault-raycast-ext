export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = (cardNumber || "").replace(/\D/g, "");
  return cleaned.length === 16;
}

export function validateCVV(cvv: string): boolean {
  const cleaned = (cvv || "").replace(/\D/g, "");
  return cleaned.length === 3;
}

export function normalizeExpiry(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  const m = raw.match(/^\s*(\d{1,2})\s*[\/-]?\s*(\d{2})\s*$/);
  if (!m) return null;
  let mm = Number(m[1]);
  const yy = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  const mmStr = mm < 10 ? `0${mm}` : String(mm);
  const yyStr = yy.toString().padStart(2, "0");
  return `${mmStr}/${yyStr}`;
}

export function validateExpiryDate(input: string): boolean {
  const canonical = normalizeExpiry(input);
  if (!canonical) return false;
  const [mmStr, yyStr] = canonical.split("/");
  const month = Number(mmStr);
  const year2 = Number(yyStr);
  const now = new Date();
  const expiryEndOfMonth = new Date(2000 + year2, month, 0);
  return expiryEndOfMonth >= new Date(now.getFullYear(), now.getMonth(), 1);
}

export function calculateUtilization(totalLimit: number, outstanding: number): number {
  if (!totalLimit || totalLimit <= 0) return 0;
  const raw = (Math.max(0, outstanding) / totalLimit) * 100;
  const clamped = Math.min(100, Math.max(0, raw));
  return Number(clamped.toFixed(2));
}