const ACRONYMS = new Set(["ct", "ut", "ttd", "otw", "boq"]);

function normalizeSpaces(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function titleCaseWithAcronyms(input: string): string {
  const words = normalizeSpaces(input).split(" ");
  const normalizedWords = words.map((word) => {
    const lower = word.toLowerCase();
    if (ACRONYMS.has(lower)) return lower.toUpperCase();
    if (!lower) return "";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return normalizedWords.join(" ");
}

/**
 * Normalizes status text casing for display and editing.
 * Example: "BELUM CT" -> "Belum CT", "SEKULER TTD" -> "Sekuler TTD".
 *
 * This is intentionally UI-only: it does not enforce DB/storage changes.
 */
export function normalizeStatusText(value?: string | null): string {
  if (value == null) return "";
  const cleaned = normalizeSpaces(String(value));
  if (!cleaned) return "";

  // Fast-path for already-canonical values.
  // (Still fixes odd spacing like "BELUM   CT".)
  return titleCaseWithAcronyms(cleaned);
}
