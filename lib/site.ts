export const SITE_URL = "https://multibrandstore.vercel.app";
export const SITE_NAME = "MultiBrand";
export const USD_PKR_FALLBACK = 278;

// "Embroidered Lawn" -> "embroidered-lawn" | "Co'ords" -> "coords"
export function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}