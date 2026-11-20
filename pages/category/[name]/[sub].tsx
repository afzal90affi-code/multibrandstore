// pages/category/[name]/[sub].tsx — PURANA PURA CODE REPLACE KARO
// Badlav:
// 1. Local Navbar hata diya (navbar ab _app.tsx se sab pages pe apne aap aata hai — double navbar khatam)
// 2. Cards ab homepage jaise: hover image swap + wishlist + Sold Out badge + Add to Bag overlay + sizes line
// 3. Price ab navbar ke currency selector pe PKR/USD switch hoti hai (useCurrency + fmt)
// 4. NAYA: IMAGE ab CLICKABLE hai — poore image pe Link overlay (z-10), click karne
//    pe /product/<_id> wala product page khulta hai (pehle sirf title clickable tha).
//    Is liye wishlist / share / Sold Out / Add to Bag sab z-20 pe hain taake unke
//    clicks Link overlay tak na jayen.
// 5. NAYA: har card pe SHARE BUTTON (image ke upar right, heart ke bagal me):
//    mobile pe native share sheet (WhatsApp isi me), desktop pe link copy +
//    1.5 sec green button + "Link Copied!" chip. Share se product page NAHI khulta.
//    NOTE: yahan components/ProductCard.tsx use NAHI ho raha (cards inline hain).
// 6. NAYA: WhatsApp FAB (neeche right) — homepage aur category page jaisa hi.
// 7. URL matching ab sakht nahi: "co-ords", "coords", "co'ords", "printed-lawn",
//    "printed lawn" — SAB chalenge (squash() neechy define hai). Pehle exact
//    slug match tha, dash/apostrophe wale URLs 404 de sakte the.
// 8. NAYA: khali subcategory pe "No products" message (blank grid ki jagah).

import { useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { sanityFetch, imgURL } from "../../../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../../../lib/site";
import { useCart, useCurrency } from "../../_app";
import { motion } from "framer-motion";
import { Heart, Share2, Check, MessageCircle } from "lucide-react";

const WA = "923333010842";

interface CategoryInfo { _id: string; name: string; }
interface SubInfo { _id: string; name: string; }
type SubProduct = {
  _id: string;
  title: string;
  price?: number;
  oldPrice?: number;
  inStock?: boolean;
  sizes?: string[];
  imgRef?: string;
  img2Ref?: string;
};

const CARD_CSS =
  ".product-card:hover .product-overlay { opacity:1; } " +
  ".product-card:hover .product-img-main { transform:scale(1.04); } " +
  ".product-card:hover .product-img-alt { opacity:1; } ";

const ALL_CATS = '*[_type == "category"]{ _id, name }';
const SUBS_OF_CAT = '*[_type == "subCategory" && parentCategory->name == $catName]{ _id, name }';
const SUB_PRODUCTS = '*[_type == "product" && subCategory._ref == $subId] | order(_createdAt desc){ _id, title, price, oldPrice, inStock, sizes, "imgRef": image.asset._ref, "img2Ref": image2.asset._ref }';

// slug matching ko maaf-dil banata hai: sirf a-z aur 0-9 rehta hai, dash /
// apostrophe / space sab udd jate hain. Is tarah "co-ords", "coords" aur
// "co'ords" — teeno tarah ke URLs ek hi category/sub se match ho jate hain.
// (Homepage apne local slugify se "coords" banata hai, lib/site ka slugify
// "co-ords" bana sakta hai — squash() dono ko barabar kar deta hai.)
function squash(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function SubCategoryPage({ category, sub, products }: { category: CategoryInfo; sub: SubInfo; products: SubProduct[] }) {
  const { addToCart } = useCart();
  const { fmt } = useCurrency();
  const [wishlist, setWishlist] = useState<string[]>([]);
  // NAYA: kis card ka link copy hua hai (green button + chip usi card pe dikhega)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddToCart = (p: SubProduct) => {
    addToCart({ id: p._id, title: p.title, price: Number(p.price), image: imgURL(p.imgRef, 600), size: p.sizes?.[0] || "Free Size", quantity: 1 });
  };

  // ━━━ NAYA: SHARE HANDLER (har card ke liye same function) ━━━
  // e.preventDefault() + e.stopPropagation() zaroori hain — warna neechy wala
  // image Link chal par jayega aur share ke bajaye product page khul jayega.
  // STEP 1 - native share sheet (mobile; WhatsApp isi list me hota hai)
  // STEP 2 - clipboard copy (desktop) + 1.5 sec "Link Copied!" feedback
  // STEP 3 - purana fallback agar clipboard API block ho
  const handleShare = async (e: any, p: SubProduct) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p._id) return;
    const url = window.location.origin + "/product/" + p._id;

    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share({ title: p.title || "MultiBrand", url });
        return;
      } catch (err: any) {
        if (err && err.name === "AbortError") return;
        // share fail hua — neechy clipboard pe gir jao
      }
    }

    const showCopied = function () {
      setCopiedId(p._id);
      window.setTimeout(function () {
        setCopiedId(null);
      }, 1500);
    };
    try {
      await navigator.clipboard.writeText(url);
      showCopied();
      return;
    } catch {}

    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopied();
    } catch {}
  };

  const title = sub.name + " – " + category.name + " | " + SITE_NAME;
  const desc = category.name + " ke andar " + sub.name + " ki collection – " + products.length + " products. " + SITE_NAME + " par original branded suits best prices par, all Pakistan delivery.";
  const canonical = SITE_URL + "/category/" + slugify(category.name) + "/" + slugify(sub.name);
  const ogImg = products[0]?.imgRef ? imgURL(products[0].imgRef, 1200) : SITE_URL + "/logo.png";

  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: category.name, item: SITE_URL + "/category/" + slugify(category.name) },
      { "@type": "ListItem", position: 3, name: sub.name, item: canonical },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImg} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
        <style>{CARD_CSS}</style>
      </Head>

      {/* Navbar + Footer _app.tsx se globally aate hain — yahan alag se nahi (double na ho) */}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link> / <Link href={"/category/" + slugify(category.name)}>{category.name}</Link> / {sub.name}
        </nav>
        <h1 style={{ fontSize: 26, margin: "8px 0" }}>{sub.name} – {category.name}</h1>
        <p style={{ color: "#666" }}>{products.length} Products</p>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600" style={{ marginTop: 20 }}>
            <p className="text-lg font-semibold">No products found in this sub-category.</p>
            <p className="text-sm text-gray-500 mt-2">
              Naye products jald add ho ge — filhal {category.name} ki baqi collection dekhein.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6" style={{ marginTop: 20 }}>
          {products.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
              className="product-card group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#F6F4F2] rounded-sm">
                {/* Pura image clickable — click karne pe product page khulta hai.
                    Z-10 rakha hai take buttons (z-20) iske UPAR rahein aur apna
                    kaam karein, navigate na karein. */}
                <Link href={"/product/" + p._id} className="absolute inset-0 z-10" aria-label={p.title}></Link>
                <img
                  src={imgURL(p.imgRef, 600)}
                  alt={p.title + " – " + sub.name + " – " + SITE_NAME}
                  className="product-img-main w-full h-full object-cover transition-transform duration-700"
                />
                {p.img2Ref && (
                  <img src={imgURL(p.img2Ref, 600)} alt="" className="product-img-alt absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500" />
                )}

                {/* ━━━ NAYA: SHARE BUTTON — hamesha visible (mobile-friendly), heart ke bagal me ━━━ */}
                <button onClick={(e) => handleShare(e, p)}
                  className={"absolute top-3 right-12 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm " +
                    (copiedId === p._id ? "bg-green-600 text-white" : "bg-white/90 text-gray-700 hover:text-gray-900")}
                  aria-label="Share product" title="Share">
                  {copiedId === p._id ? <Check size={14} strokeWidth={2.5} /> : <Share2 size={14} strokeWidth={1.5} />}
                </button>
                {copiedId === p._id && (
                  <span className="absolute top-12 right-3 z-20 bg-gray-900 text-white text-[9px] font-semibold tracking-wide px-2 py-1 rounded-full">Link Copied!</span>
                )}

                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p._id); }}
                  className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm">
                  <Heart size={14} strokeWidth={1.5} className={wishlist.includes(p._id) ? "fill-rose-500 stroke-rose-500" : "stroke-gray-600"} />
                </button>

                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                  {p.inStock === false && (
                    <span className="bg-[#1a1a1a] text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm">Sold Out</span>
                  )}
                </div>

                <div className="product-overlay absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 transition-opacity duration-300">
                  <button disabled={p.inStock === false}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(p); }}
                    className="w-full bg-white/95 backdrop-blur-sm text-gray-900 py-2.5 text-[10.5px] font-semibold tracking-[0.12em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm">
                    {p.inStock === false ? "Sold Out" : "Add to Bag"}
                  </button>
                </div>
              </div>

              <div className="mt-3.5">
                <Link href={"/product/" + p._id}>
                  <h4 className="text-[13px] font-medium text-gray-800 leading-snug hover:text-rose-600 transition-colors line-clamp-2">{p.title}</h4>
                </Link>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[13.5px] font-semibold text-gray-900">{fmt(Number(p.price) || 0)}</span>
                </div>
                {p.sizes && p.sizes.length > 0 && (
                  <p className="text-[15px] text-gray-400 mt-1 tracking-wide">{p.sizes.join(" · ")}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </main>

      <a
        href={"https://wa.me/" + WA + "?text=" + encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}
        target="_blank"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const subs = await sanityFetch<{ name: string; parent: string }[]>(
    '*[_type == "subCategory" && defined(parentCategory)]{ name, "parent": parentCategory->name }'
  );
  return {
    paths: subs.map((s) => ({ params: { name: slugify(s.parent), sub: slugify(s.name) } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<{ category: CategoryInfo; sub: SubInfo; products: SubProduct[] }> = async ({ params }) => {
  // squash() se match karte hain — exact slug match nahi. Is tarah
  // "coords", "co-ords" type URLs bhi sahi sub se match ho jate hain,
  // chahe URL kisi aur slugify se bana ho.
  const rawName = String(params?.name || "");
  const rawSub = String(params?.sub || "");

  const cats = await sanityFetch<CategoryInfo[]>(ALL_CATS);
  const category = cats.find((c) => squash(slugify(c.name)) === squash(rawName));
  if (!category) return { notFound: true };

  const subs = await sanityFetch<SubInfo[]>(SUBS_OF_CAT, { catName: category.name });
  const sub = subs.find((s) => squash(slugify(s.name)) === squash(rawSub));
  if (!sub) return { notFound: true };

  const products = await sanityFetch<SubProduct[]>(SUB_PRODUCTS, { subId: sub._id });
  return { props: { category, sub, products }, revalidate: 300 };
};