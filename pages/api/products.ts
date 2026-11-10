// FILE: pages/api/products.ts  (PURANA PURA CODE REPLACE KARO)
import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity";

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
  variants?: ProductVariant[];
};

function imgRef(assetId: string): ImageRef {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const b = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};

    if (!b.title || !b.price || !b.category || !b.image) {
      return res.status(400).json({ error: "title, price, category aur image zaroori hain" });
    }

    const doc: ProductDoc = {
      _type: "product",
      title: String(b.title).trim(),
      price: Number(b.price),
      inStock: b.inStock !== false,
      featured: Boolean(b.featured),
      sizes: Array.isArray(b.sizes) ? b.sizes.filter(Boolean) : [],
      category: { _type: "reference", _ref: String(b.category) },
      image: imgRef(String(b.image)),
    };

    if (b.brand) doc.brand = String(b.brand).trim();
    if (b.oldPrice && Number(b.oldPrice) > 0) doc.oldPrice = Number(b.oldPrice);
    if (b.subCategory) doc.subCategory = { _type: "reference", _ref: String(b.subCategory) };
    if (b.description) doc.description = String(b.description).trim();
    if (b.material) doc.material = String(b.material).trim();
    if (Array.isArray(b.highlights) && b.highlights.length) {
      doc.highlights = b.highlights.map((h: unknown) => String(h).trim()).filter(Boolean);
    }
    if (b.image2) doc.image2 = imgRef(String(b.image2));
    if (Array.isArray(b.variants) && b.variants.length) {
      doc.variants = b.variants
        .filter((v: { printName?: string; image?: string }) => v && v.printName && v.image)
        .map((v: { printName: string; image: string; inStock?: boolean; price?: number }, i: number) => ({
          _type: "variant",
          _key: `v${Date.now()}${i}`,
          printName: String(v.printName).trim(),
          inStock: v.inStock !== false,
          image: imgRef(String(v.image)),
          ...(v.price && Number(v.price) > 0 ? { price: Number(v.price) } : {}),
        }));
    }

    const created = await client.create(doc);
    return res.status(200).json({ ok: true, id: created._id });
  } catch (err) {
    console.error("Product create failed:", err);
    return res.status(500).json({ error: "Product save nahi hua" });
  }
}