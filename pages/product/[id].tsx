import type { GetStaticPaths, GetStaticProps } from "next";
import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { sanityFetch, imgURL, type Product, type Variant } from "../../lib/client";
import { SITE_NAME, slugify } from "../../lib/site";
import ProductSEO from "../../components/ProductSEO";
import PricePKRUSD from "../../components/PricePKRUSD";

const ALL_IDS = `*[_type == "product"]{ _id }`;
const PRODUCT_BY_ID = `*[_type == "product" && _id == $id][0]{
  _id, title, price, oldPrice, description, inStock, sizes, highlights, material,
  "imgRef": image.asset->_ref,
  "cat": category->name,
  "sub": subCategory->name,
  "variants": variants[]{ printName, inStock, price, "vRef": image.asset->_ref }
}`;

const thumbStyle = (active: boolean): CSSProperties => ({
  width: 60,
  height: 74,
  padding: 0,
  overflow: "hidden",
  border: active ? "2px solid #333" : "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
  background: "#f5f5f5",
  fontSize: 11,
  color: "#555",
});

export default function ProductPage({ product }: { product: Product }) {
  const [sel, setSel] = useState(-1); // -1 = main photo, 0+ = variant
  if (!product) return null;

  const variants: Variant[] = product.variants || [];
  const v = sel >= 0 ? variants[sel] || null : null;
  const shownImg = v && v.vRef ? imgURL(v.vRef, 900) : imgURL(product.imgRef, 900);
  const price = v && v.price ? v.price : product.price;
  const inStock = v ? v.inStock !== false : product.inStock !== false;

  return (
    <>
      {/* SEO: poora <head> + Google Product schema */}
      <ProductSEO product={product} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link>
          {product.cat ? <> / <Link href={`/category/${slugify(product.cat)}`}>{product.cat}</Link></> : null}
          {" / "}{product.title}
        </nav>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* ===== LEFT: Photo + Prints thumbnails ===== */}
          <div style={{ flex: "1 1 400px" }}>
            <img
              src={shownImg}
              alt={`${product.title}${v?.printName ? ` – ${v.printName}` : ""} – ${product.cat || ""} – ${SITE_NAME}`}
              width={900}
              height={1100}
              style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }}
            />

            {variants.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={() => setSel(-1)} style={thumbStyle(sel === -1)} title="Main Photo">
                  <img
                    src={imgURL(product.imgRef, 160)}
                    alt={`${product.title} main photo`}
                    width={60}
                    height={74}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
                {variants.map((vr, i) => (
                  <button key={i} onClick={() => setSel(i)} style={thumbStyle(sel === i)} title={vr.printName || "Print"}>
                    {vr.vRef ? (
                      <img
                        src={imgURL(vr.vRef, 160)}
                        alt={`${product.title} – ${vr.printName || "print"}`}
                        width={60}
                        height={74}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span>{(vr.printName || "?").slice(0, 3)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== RIGHT: Details ===== */}
          <div style={{ flex: "1 1 300px" }}>
            <h1 style={{ fontSize: 26 }}>{product.title}</h1>

            {v?.printName ? (
              <p style={{ color: "#555", fontSize: 15, margin: "4px 0" }}>
                Design: <b>{v.printName}</b>
              </p>
            ) : null}

            <p style={{ fontSize: 20 }}>
              <PricePKRUSD pkr={price} />
              {product.oldPrice ? (
                <del style={{ color: "#999", marginLeft: 10, fontWeight: 400 }}>
                  PKR {Number(product.oldPrice).toLocaleString("en-PK")}
                </del>
              ) : null}
            </p>

            <p>
              {inStock
                ? <span style={{ color: "#080", fontWeight: 600 }}>✅ In Stock</span>
                : <span style={{ color: "#c00", fontWeight: 600 }}>❌ Out of Stock</span>}
            </p>

            {variants.length > 1 ? (
              <p style={{ color: "#888", fontSize: 13 }}>
                {variants.length} designs available — upar photos click kar ke dekho
              </p>
            ) : null}

            {(product.sizes || []).length > 0 && (
              <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
                {(product.sizes || []).map((s, i) => (
                  <span key={i} style={{ padding: "6px 14px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}>
                    {String(s)}
                  </span>
                ))}
              </div>
            )}

            {product.material ? <p style={{ color: "#666" }}>Fabric: {product.material}</p> : null}

            {(product.highlights || []).length > 0 && (
              <ul style={{ paddingLeft: 20, color: "#444", lineHeight: 1.7 }}>
                {(product.highlights || []).map((h, i) => (
                  <li key={i}>{String(h)}</li>
                ))}
              </ul>
            )}

            {product.description ? <p style={{ lineHeight: 1.7, color: "#444" }}>{product.description}</p> : null}

            {/* YAHAN APNA ORDER / ADD-TO-CART / WHATSAPP BUTTON LAGA SAKTE HO */}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ids = await sanityFetch<{ _id: string }[]>(ALL_IDS);
  return { paths: ids.map((p) => ({ params: { id: p._id } })), fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<{ product: Product }> = async ({ params }) => {
  const product = await sanityFetch<Product | null>(PRODUCT_BY_ID, { id: params?.id });
  if (!product) return { notFound: true };
  return { props: { product }, revalidate: 300 };
};