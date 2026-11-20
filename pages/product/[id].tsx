// pages/product/[id].tsx — PURANA PURA CODE REPLACE KARO
// Change: MAIN IMAGE ki height cap — bohat tall photos (jaise 704x1521) ab
// 680px se ziada lambi nahi banti. objectFit cover + objectPosition top:
// photo stretch nahi hoti, sirf neeche ka extra hissa crop hota hai aur
// model ka face hamesha visible rehta hai. Normal / 4:5 images par zero asar.
// Baqi sab (currency toggle, ProductSEO, WhatsApp, related cards) same hai.

import type { GetStaticPaths, GetStaticProps } from "next";
import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { sanityFetch, imgURL, type Product, type Variant } from "../../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../../lib/site";
import { useCart, useCurrency } from "../../pages/_app";
import ProductSEO from "../../components/ProductSEO";
import ProductCard from "../../components/ProductCard";

// Queries single-quote me hain — copy/paste safe
const ALL_IDS = '*[_type == "product"]{ _id }';

const PRODUCT_BY_ID = '*[_type == "product" && _id == $id][0]{ _id, title, brand, price, oldPrice, description, inStock, sizes, highlights, material, "imgRef": image.asset._ref, "img2Ref": image2.asset._ref, "img3Ref": image3.asset._ref, "cat": category->name, "sub": subCategory->name, "variants": variants[]{ printName, inStock, price, "vRef": image.asset._ref } }';

const RELATED_BY_CAT = '*[_type == "product" && _id != $id && (category->name == $cat || subCategory->parentCategory->name == $cat)] | order(_createdAt desc)[0...8]{ _id, title, price, oldPrice, brand, inStock, "imgRef": image.asset._ref, "img2Ref": image2.asset._ref, "sub": subCategory->name }';

const OTHER_CATS = '*[_type == "product" && _id != $id && category->name != $cat && subCategory->parentCategory->name != $cat] | order(_createdAt desc)[0...8]{ _id, title, price, oldPrice, brand, inStock, "imgRef": image.asset._ref, "img2Ref": image2.asset._ref, "sub": subCategory->name }';

// Photo 2 / Photo 3 optional extra photos (admin se aati hain)
type ProductWithGallery = Product & { img2Ref?: string | null; img3Ref?: string | null };

// ProductCard component ke type se compatible
type CardProduct = { _id: string; title: string; price?: number; oldPrice?: number; brand?: string; inStock?: boolean; imgRef?: string; img2Ref?: string; sub?: string };

const WA = "923333010842";

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

const qtyBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  fontSize: 16,
  cursor: "pointer",
  lineHeight: 1,
};

export default function ProductPage({ product, related, others }: { product: ProductWithGallery; related: CardProduct[]; others: CardProduct[] }) {
  // -1 = main photo, -2 = Photo 2, -3 = Photo 3, 0+ = variant/print
  const [sel, setSel] = useState(-1);
  const [size, setSize] = useState<string>(() => (product && product.sizes && product.sizes.length ? String(product.sizes[0]) : "Free Size"));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  // CURRENCY: header toggle se currency change hoti hai to fmt naya format
  // de deta hai aur yeh page foran re-render ho kar naya price dikhata hai
  const { fmt } = useCurrency();
  if (!product) return null;

  const variants: Variant[] = product.variants || [];
  const v = sel >= 0 ? variants[sel] || null : null;
  const img2 = product.img2Ref || "";
  const img3 = product.img3Ref || "";

  let shownImg = v && v.vRef ? imgURL(v.vRef, 900) : imgURL(product.imgRef, 900);
  if (sel === -2 && img2) shownImg = imgURL(img2, 900);
  if (sel === -3 && img3) shownImg = imgURL(img3, 900);

  const shownLabel = sel === -2 ? "Photo 2" : sel === -3 ? "Photo 3" : v && v.printName ? v.printName : "";
  const price = v && v.price ? v.price : product.price;
  const inStock = v ? v.inStock !== false : product.inStock !== false;
  const hasThumbs = variants.length > 0 || img2 !== "" || img3 !== "";

  const handleAddToCart = () => {
    addToCart({ id: product._id, title: product.title, price: Number(price), image: imgURL(product.imgRef, 400), size: size, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  // WhatsApp order hamesha PKR total me jata hai — customer ko PKR me pay karna hai,
  // USD sirf website display ke liye hai
  const handleWhatsAppOrder = () => {
    const total = Number(price) * qty;
    const message =
      "🛍️ *New Order — MultiBrand*\n" +
      "━━━━━━━━━━━━━━━━\n\n" +
      "*" + product.title + "*\n" +
      (product.brand ? "   Brand: " + product.brand + "\n" : "") +
      (shownLabel ? "   Design: " + shownLabel + "\n" : "") +
      "   Size: " + size + " | Qty: " + qty + " | PKR " + total.toLocaleString() + "\n" +
      "   🔗 Product: " + SITE_URL + "/product/" + product._id + "\n\n" +
      "━━━━━━━━━━━━━━━━\n" +
      "💰 *Total: PKR " + total.toLocaleString() + "*\n\n" +
      "👤 *Customer Details*\n" +
      "Name: \nPhone: \nCity: \nAddress:";
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(message), "_blank");
  };

  return (
    <>
      {/* SEO: poora <head> + Google Product schema */}
      <ProductSEO
        product={{
          ...product,
          brand: product.brand ?? undefined,
          oldPrice: product.oldPrice ?? undefined,
          description: product.description ?? undefined,
          imgRef: product.imgRef ?? undefined,
          img2Ref: product.img2Ref ?? undefined,
          img3Ref: product.img3Ref ?? undefined,
          cat: product.cat ?? undefined,
          sub: product.sub ?? undefined,
        }}
      />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link>
          {product.cat ? <> / <Link href={"/category/" + slugify(product.cat)}>{product.cat}</Link></> : null}
          {" / "}{product.title}
        </nav>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* ===== LEFT: Main photo + Photo 2/3 + Prints thumbnails ===== */}
          <div style={{ flex: "1 1 400px" }}>
            <img
              src={shownImg}
              alt={product.title + (shownLabel ? " – " + shownLabel : "") + " – " + (product.cat || "") + " – " + SITE_NAME}
              width={900}
              height={1100}
              style={{ width: "100%", height: "auto", maxHeight: 680, objectFit: "cover", objectPosition: "top", borderRadius: 8, display: "block" }}
            />

            {hasThumbs && (
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={() => setSel(-1)} style={thumbStyle(sel === -1)} title="Main Photo">
                  <img
                    src={imgURL(product.imgRef, 160)}
                    alt={product.title + " main photo"}
                    width={60}
                    height={74}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
                {img2 ? (
                  <button onClick={() => setSel(-2)} style={thumbStyle(sel === -2)} title="Photo 2">
                    <img
                      src={imgURL(img2, 160)}
                      alt={product.title + " photo 2"}
                      width={60}
                      height={74}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ) : null}
                {img3 ? (
                  <button onClick={() => setSel(-3)} style={thumbStyle(sel === -3)} title="Photo 3">
                    <img
                      src={imgURL(img3, 160)}
                      alt={product.title + " photo 3"}
                      width={60}
                      height={74}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ) : null}
                {variants.map((vr, i) => (
                  <button key={i} onClick={() => setSel(i)} style={thumbStyle(sel === i)} title={vr.printName || "Print"}>
                    {vr.vRef ? (
                      <img
                        src={imgURL(vr.vRef, 160)}
                        alt={product.title + " – " + (vr.printName || "print")}
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

          {/* ===== RIGHT: Details + Add to Cart ===== */}
          <div style={{ flex: "1 1 300px" }}>
            {/* BRAND — Google aur customer dono ke liye */}
            {product.brand ? (
              <p style={{ color: "#c2185b", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>
                {product.brand}
              </p>
            ) : null}

            <h1 style={{ fontSize: 26 }}>{product.title}</h1>

            {v?.printName ? (
              <p style={{ color: "#555", fontSize: 15, margin: "4px 0" }}>
                Design: <b>{v.printName}</b>
              </p>
            ) : null}

            {/* PRICE — fmt har currency ka sahi format deta hai, toggle pe live change hota hai */}
            <p style={{ fontSize: 20 }}>
              {fmt(Number(price || 0))}
              {product.oldPrice ? (
                <del style={{ color: "#999", marginLeft: 10, fontWeight: 400 }}>
                  {fmt(Number(product.oldPrice))}
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

            {/* SIZE SELECTOR — click kar ke size choose karo */}
            {(product.sizes || []).length > 0 ? (
              <div style={{ margin: "14px 0" }}>
                <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px", fontWeight: 600 }}>Size</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(product.sizes || []).map((s, i) => {
                    const sName = String(s);
                    return (
                      <button
                        key={i}
                        onClick={() => setSize(sName)}
                        style={{
                          padding: "8px 16px",
                          border: size === sName ? "2px solid #1a1a1a" : "1px solid #ccc",
                          borderRadius: 6,
                          fontSize: 14,
                          background: size === sName ? "#1a1a1a" : "#fff",
                          color: size === sName ? "#fff" : "#333",
                          cursor: "pointer",
                        }}
                      >
                        {sName}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: "#666", fontSize: 14, margin: "12px 0" }}>Size: Free Size</p>
            )}

            {/* QUANTITY SELECTOR */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Qty</span>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={qtyBtnStyle}>−</button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={qtyBtnStyle}>+</button>
            </div>

            {/* ADD TO BAG + WHATSAPP ORDER */}
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                style={{
                  flex: "1 1 180px",
                  padding: "14px 18px",
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: inStock ? "pointer" : "not-allowed",
                  opacity: inStock ? 1 : 0.5,
                }}
              >
                {inStock ? "ADD TO BAG" : "OUT OF STOCK"}
              </button>
              <button
                onClick={handleWhatsAppOrder}
                disabled={!inStock}
                style={{
                  flex: "1 1 180px",
                  padding: "14px 18px",
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: inStock ? "pointer" : "not-allowed",
                  opacity: inStock ? 1 : 0.5,
                }}
              >
                ORDER ON WHATSAPP
              </button>
            </div>

            {added ? (
              <p style={{ color: "#080", fontWeight: 600, marginTop: 12, fontSize: 14 }}>
                Bag me add ho gaya — upar cart icon me check karo
              </p>
            ) : null}
          </div>
        </div>

        {/* ━━━ PRODUCT DETAILS ━━━ */}
        <section style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: "0 0 12px" }}>Product Details</h2>
          {product.description ? (
            <p style={{ lineHeight: 1.8, color: "#444", whiteSpace: "pre-line", maxWidth: 800 }}>
              {product.description}
            </p>
          ) : (
            <p style={{ lineHeight: 1.8, color: "#666", maxWidth: 800 }}>
              {product.title} — {product.cat ? product.cat + " collection ka original branded design" : "original branded design"} {SITE_NAME} par. All Pakistan delivery, easy ordering aur best prices. Size ya fabric ki mazeed detail ke liye WhatsApp par rabta karein.
            </p>
          )}
          {product.material ? (
            <p style={{ color: "#666", marginTop: 12 }}><b>Fabric:</b> {product.material}</p>
          ) : null}
          {(product.highlights || []).length > 0 ? (
            <ul style={{ paddingLeft: 20, color: "#444", lineHeight: 1.8, marginTop: 12, maxWidth: 800 }}>
              {(product.highlights || []).map((h, i) => (
                <li key={i}>{String(h)}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* ━━━ RELATED PRODUCTS (same category) — ProductCard component ━━━ */}
        {related.length > 0 && (
          <section style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 24 }}>
            <h2 style={{ fontSize: 20, margin: "0 0 16px" }}>
              {product.cat ? "More in " + product.cat : "Related Products"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {related.map((r) => (
                <ProductCard key={r._id} p={r} />
              ))}
            </div>
          </section>
        )}

        {/* ━━━ YOU MAY ALSO LIKE (dusri categories se) — ProductCard component ━━━ */}
        {others.length > 0 && (
          <section style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 24 }}>
            <h2 style={{ fontSize: 20, margin: "0 0 16px" }}>You May Also Like</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {others.map((r) => (
                <ProductCard key={r._id} p={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ids = await sanityFetch<{ _id: string }[]>(ALL_IDS);
  return { paths: ids.map((p) => ({ params: { id: p._id } })), fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<{ product: ProductWithGallery; related: CardProduct[]; others: CardProduct[] }> = async ({ params }) => {
  const product = await sanityFetch<ProductWithGallery | null>(PRODUCT_BY_ID, { id: params?.id });
  if (!product) return { notFound: true };

  const catName = product.cat || "";
  const [related, others] = await Promise.all([
    sanityFetch<CardProduct[]>(RELATED_BY_CAT, { id: product._id, cat: catName }),
    sanityFetch<CardProduct[]>(OTHER_CATS, { id: product._id, cat: catName }),
  ]);
  return { props: { product, related, others }, revalidate: 300 };
};