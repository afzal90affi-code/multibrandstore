// components/ProductSEO.tsx — PURANA PURA CODE REPLACE KARO
// Full SEO package is component me hai — page ke <head> me sab kuch dalta hai:
// 1. Title + meta description (price ke saath, Google result me acha dikhta hai)
// 2. Canonical link (duplicate content se bachata hai)
// 3. Robots meta (Google ko indexing ki ijazat + badi image preview)
// 4. Open Graph + Twitter card (WhatsApp/Facebook share pe photo + price dikhegi)
// 5. Google Product schema (JSON-LD): PKR price, stock status, brand, SKU
// 6. Breadcrumb schema: Home > Category > Product

import Head from "next/head";
import { imgURL } from "../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../lib/site";

type SEOProduct = {
  _id: string;
  title: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  description?: string;
  inStock?: boolean;
  imgRef?: string;
  img2Ref?: string;
  img3Ref?: string;
  cat?: string;
  sub?: string;
};

// JSON-LD me "</script>" wala khatra khatam — < ko unicode escape kar dete hain
const jsonSafe = (obj: unknown): string => JSON.stringify(obj).replace(/</g, "\\u003c");

export default function ProductSEO({ product }: { product: SEOProduct }) {
  if (!product || !product._id || !product.title) return null;

  const url = SITE_URL + "/product/" + product._id;
  const price = Number(product.price || 0);
  const availability = product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";

  // Photos: main + Photo 2 + Photo 3 — jo milen sab schema me
  const photos = [product.imgRef, product.img2Ref, product.img3Ref]
    .map((r) => imgURL(r, 1200))
    .filter((r) => r !== "");
  const schemaImages = photos.length > 0 ? photos : [SITE_URL + "/logo.png"];
  const ogImage = photos[0] || SITE_URL + "/logo.png";

  // TITLE: brand + product name + site name
  // (agar brand product title me already mojood ho to dobara nahi lagate)
  const brandInTitle = product.brand ? product.title.toLowerCase().indexOf(product.brand.toLowerCase()) !== -1 : false;
  const brandBit = product.brand && !brandInTitle ? product.brand + " " : "";
  const title = brandBit + product.title + " | " + SITE_NAME;

  // DESCRIPTION: Sanity description se, warna auto text; price add karo agar jagah ho
  const rawDesc = String(product.description || "").replace(/\s+/g, " ").trim();
  let desc = rawDesc;
  if (desc.length < 40) {
    desc = product.title + " - " + (product.cat || SITE_NAME) + " ka original branded design. All Pakistan delivery, easy returns.";
  }
  if (price > 0 && desc.length + 30 <= 158) {
    desc = desc + " Price: PKR " + price.toLocaleString("en-US") + ".";
  }
  if (desc.length > 160) {
    desc = desc.slice(0, 157) + "...";
  }

  // GOOGLE PRODUCT SCHEMA — Google Shopping / rich results ke liye
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: schemaImages,
    description: desc,
    sku: product._id,
    brand: { "@type": "Brand", name: product.brand || SITE_NAME },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "PKR",
      price: price,
      itemCondition: "https://schema.org/NewCondition",
      availability: availability,
    },
  };

  // BREADCRUMB SCHEMA — Google result me Home > Category > Product dikhega
  const crumbs: { "@type": string; position: number; name: string; item?: string }[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ];
  if (product.cat) {
    crumbs.push({ "@type": "ListItem", position: 2, name: product.cat, item: SITE_URL + "/category/" + slugify(product.cat) });
    if (product.sub) {
      crumbs.push({ "@type": "ListItem", position: 3, name: product.sub, item: SITE_URL + "/category/" + slugify(product.cat) + "/" + slugify(product.sub) });
    }
  }
  crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: product.title });
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow, max-image-preview:large" />

      {/* Open Graph — WhatsApp / Facebook share preview */}
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="product:price:amount" content={String(price)} />
      <meta property="product:price:currency" content="PKR" />

      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Google schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSafe(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSafe(breadcrumbLd) }} />
    </Head>
  );
}