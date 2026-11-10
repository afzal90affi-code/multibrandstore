const API = "https://vieoyox0.api.sanity.io/v2021-10-21/data/query/production";

// ===== Types =====
export interface Variant {
  printName?: string | null;
  inStock?: boolean;
  price?: number | null;
  vRef?: string | null;
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  inStock?: boolean;
  imgRef?: string | null;
  description?: string | null;
  cat?: string | null;
  sub?: string | null;
  sizes?: unknown[];
  highlights?: string[] | null;
  material?: string | null;
  variants?: Variant[] | null;
  brand?: string | null; // ← NAYI LINE
}

// ===== Sanity data fetch (koi package nahi chahiye) =====
export async function sanityFetch<T = unknown>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const search = new URLSearchParams({ query });
  for (const k in params) search.set(`$${k}`, JSON.stringify(params[k]));
  const res = await fetch(`${API}?${search.toString()}`);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

// ===== Sanity image ka fast optimized URL =====
export function imgURL(ref?: string | null, w = 800, q = 75): string {
  if (!ref) return "";
  const noPrefix = ref.replace("image-", "");
  const parts = noPrefix.split("-");
  const ext = parts.pop();
  const id = parts.join("-");
  return `https://cdn.sanity.io/images/vieoyox0/production/${id}.${ext}?w=${w}&q=${q}&auto=format&fit=max`;
}