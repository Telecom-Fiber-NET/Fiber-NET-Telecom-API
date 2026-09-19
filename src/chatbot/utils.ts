export function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) return "***";
  return `${normalized.slice(0, 4)}***${normalized.slice(-4)}`;
}

export function firstName(name?: string): string {
  return String(name || "").trim().split(/\s+/)[0] || "cliente";
}

export function parseJsonObject<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < jsonStart) return null;

  try {
    return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as T;
  } catch {
    return null;
  }
}
