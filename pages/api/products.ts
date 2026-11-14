// FILE: pages/api/products.ts  (PURANA PURA CODE REPLACE KARO)
import type { NextApiRequest, NextApiResponse } from "next";
import { writeClient } from "../../lib/sanity";

type SanityRef = { _type: "reference"; _ref: string };
type ImageRef = { _type: "image"; asset: SanityRef };
type ProductVariant = {
  _type: "variant";
  _key: string;
  printName: string;
  inStock: boolean;
  image: ImageRef;
  price?: number;
};
type ProductDoc = {
  _type: "product";
  title: string;
  price: number;
  inStock: boolean;
  featured: boolean;
  sizes: string[];
  category: SanityRef;
  image: ImageRef;
  brand?: string;
  oldPrice?: number;
  subCategory?: SanityRef;
  description?: string;
  material?: string;
  highlights?: string[];
  image2?: ImageRef;
  image3?: ImageRef;
  variants?: ProductVariant[];
};

function imgRef(assetId: string): ImageRef {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

function toId(v: unknown): string {
  if (v && typeof v === "object" && "_ref" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>)._ref).trim();
  }
  return String(v || "").trim();
}

function toSizes(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const b = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};

    const title = String(b.title || "").trim();
    const price = Number(b.price);
    const categoryRef = toId(b.category);
    const mainImage = toId(b.image);

    if (!title || !price || price <= 0 || !categoryRef || !mainImage) {
      return res.status(400).json({ error: "title, price, category aur image zaroori hain" });
    }

    const doc: ProductDoc = {
      _type: "product",
      title: title,
      price: price,
      inStock: b.inStock !== false,
      featured: Boolean(b.featured),
      sizes: toSizes(b.sizes),
      category: { _type: "reference", _ref: categoryRef },
      image: imgRef(mainImage),
    };

    const brand = String(b.brand || "").trim();
    if (brand) doc.brand = brand;

    const oldPrice = Number(b.oldPrice);
    if (oldPrice && oldPrice > 0) doc.oldPrice = oldPrice;

    const subRef = toId(b.subCategory);
    if (subRef) doc.subCategory = { _type: "reference", _ref: subRef };

    const description = String(b.description || "").trim();
    if (description) doc.description = description;

    const material = String(b.material || "").trim();
    if (material) doc.material = material;

    if (Array.isArray(b.highlights) && b.highlights.length) {
      doc.highlights = b.highlights.map((h: unknown) => String(h).trim()).filter(Boolean);
    }

    const img2 = toId(b.image2);
    if (img2) doc.image2 = imgRef(img2);

    const img3 = toId(b.image3);
    if (img3) doc.image3 = imgRef(img3);

    if (Array.isArray(b.variants) && b.variants.length) {
      const variants: ProductVariant[] = b.variants
        .filter((v: { printName?: string; image?: string }) => v && v.printName && v.image)
        .map((v: { printName: string; image: string; inStock?: boolean; price?: number }, i: number) => {
          const item: ProductVariant = {
            _type: "variant",
            _key: "v" + Date.now() + "_" + i,
            printName: String(v.printName).trim(),
            inStock: v.inStock !== false,
            image: imgRef(toId(v.image)),
          };
          const vp = Number(v.price);
          if (vp && vp > 0) item.price = vp;
          return item;
        });
      if (variants.length) doc.variants = variants;
    }

    const created = await writeClient.create(doc);
    return res.status(200).json({ ok: true, id: created._id });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Product create failed:", detail);
    return res.status(500).json({
      error: "Product save nahi hua",
      detail: String(detail).slice(0, 400),
    });
  }
}