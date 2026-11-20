// pages/category/[name].tsx
// PURANA PURA CODE REPLACE KARO
//
// NAVBAR + FOOTER KA TAREEQA: dono ab _app.tsx se SAB pages pe apne aap aate
// hain (global, admin pe hidden) — is page me alag se <Navbar /> ya inline
// <footer> NAHI lagta (warna double navbar / double footer ho jata).
// components/Navbar.tsx me mega dropdown hai jisme Collections ke neeche
// SUB-CATEGORIES dikhti hain. components/Footer.tsx global footer hai.
//
// NAYA: har product card ke image ke TOP-RIGHT pe SHARE BUTTON:
//   - Mobile pe native share sheet khulta hai (WhatsApp, Copy link, Messages
//     sab isi list me aate hain)
//   - Desktop pe link clipboard me copy — button 1.5 sec green + "Link Copied!"
//     chip. Share click se product page NAHI khulta (sirf share hota hai)
//   - NOTE: yahan components/ProductCard.tsx use NAHI ho raha (cards inline
//     hain), is liye share button yahan alag se add kiya gaya hai
//
// BAQI SAB SAME: sub filter chips, product grid, hover add-to-cart, sold out
// overlay, sizes, empty state, WhatsApp button — design bilkul waisa hi.
// (Navbar aur footer ab global hain, is liye yahan nahi hain.)
//
// URL handling: "printed-lawn" (dash), "printed lawn" (space),
// "coords" (bina apostrophe) aur "co'ords" — SAB chalenge.

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, MessageCircle, Share2, Check } from "lucide-react";
import { client } from "../../lib/sanity";
import { useCart } from "../_app";
import * as AppExtras from "../_app";

const WA = "923333010842";
const LOGO_URL = "/logo.png";

// ━━━ GROQ QUERIES ━━━
const CATS_GROQ =
  '*[_type == "category" && active == true] { _id, name, icon, "image": coalesce(image.asset->url, "") }';
const ALL_SUBS_GROQ = '*[_type == "subCategory"] { _id, name, icon }';
const SUBS_OF_CAT_GROQ =
  '*[_type == "subCategory" && lower(parentCategory->name) == $catName] | order(name asc) { _id, name, icon }';
const PRODS_BY_CAT_GROQ =
  '*[_type == "product" && defined(subCategory) && lower(subCategory->parentCategory->name) == $catName] | order(_createdAt desc) { _id, title, price, inStock, sizes, "categoryName": category->name, "subCategoryName": subCategory->name, "image": coalesce(image.asset->url, ""), "image2": coalesce(image2.asset->url, "") }';
const PRODS_BY_SUB_GROQ =
  '*[_type == "product" && defined(subCategory) && lower(subCategory->name) == $subName] | order(_createdAt desc) { _id, title, price, inStock, sizes, "categoryName": category->name, "subCategoryName": subCategory->name, "image": coalesce(image.asset->url, ""), "image2": coalesce(image2.asset->url, "") }';

// URL aur naam dono ko ek standard shape me le aata hai:
// "co'ords" -> "coords", "embroidered-lawn" -> "embroidered lawn"
function norm(s: string): string {
  const lowered = String(s || "").toLowerCase().replace(/-/g, " ");
  let cleaned = "";
  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered.charAt(i);
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === " ") {
      cleaned += ch;
    }
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

// Agar _app.tsx me useCurrency export nahi hai (purana _app) to bhi page
// crash nahi hoga — fallback: PKR price. Naya _app laga hai to toggle chalta hai.
function useSafeCurrency() {
  const extras = AppExtras as any;
  if (typeof extras.useCurrency === "function") {
    const c = extras.useCurrency();
    if (c && typeof c.fmt === "function") return c;
  }
  return {
    currency: "PKR" as "PKR" | "USD",
    setCurrency: function (c: "PKR" | "USD") {},
    fmt: function (pkr: number) {
      return "PKR " + Number(pkr || 0).toLocaleString("en-US");
    },
  };
}

// URL param ko saaf naam banata hai: "printed-lawn" -> "Printed Lawn"
function prettyName(raw: string): string {
  const spaced = decodeURIComponent(raw).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  return spaced
    .split(" ")
    .map(function (w) {
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(" ");
}

export default function CategoryPage() {
  const router = useRouter();
  const rawName = String(router.query.name || "");
  const displayName = prettyName(rawName);

  const [prods, setProds] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // NAYA: kis card ka link copy hua hai (green button + chip usi card pe dikhega)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { fmt } = useSafeCurrency();

  useEffect(() => {
    const urlNorm = norm(decodeURIComponent(rawName));
    if (!urlNorm) return;
    let dead = false;
    (async () => {
      setLoading(true);
      try {
        // STEP 1: saari categories le kar URL se norm() se match karo
        // (is tarah "coords" URL bhi "co'ords" category se match ho jata hai)
        const cats: any[] = (await client.fetch(CATS_GROQ)) || [];
        const cat = cats.find(function (c: any) {
          return norm(c.name) === urlNorm;
        });

        if (dead) return;

        if (cat) {
          // CATEGORY match hui — sub chips + products by category
          const catParam = { catName: String(cat.name).toLowerCase().trim() };
          const subsData: any[] = (await client.fetch(SUBS_OF_CAT_GROQ, catParam)) || [];
          if (dead) return;
          setSubs(subsData);
          setActiveSub(null);
          const prodsData: any[] = (await client.fetch(PRODS_BY_CAT_GROQ, catParam)) || [];
          if (dead) return;
          setProds(
            prodsData.map(function (p: any) {
              return { ...p, id: p._id, category: p.categoryName };
            })
          );
        } else {
          // CATEGORY nahi mili — shayad SUB-CATEGORY ka URL ho (jaise /category/silk)
          const allSubs: any[] = (await client.fetch(ALL_SUBS_GROQ)) || [];
          const sub = allSubs.find(function (s: any) {
            return norm(s.name) === urlNorm;
          });
          if (dead) return;
          setSubs([]);
          setActiveSub(null);
          if (sub) {
            const prodsData: any[] =
              (await client.fetch(PRODS_BY_SUB_GROQ, { subName: String(sub.name).toLowerCase().trim() })) || [];
            if (dead) return;
            setProds(
              prodsData.map(function (p: any) {
                return { ...p, id: p._id, category: p.categoryName };
              })
            );
          } else {
            setProds([]);
          }
        }
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return function () {
      dead = true;
    };
  }, [rawName]);

  // ━━━ NAYA: SHARE HANDLER (har card ke liye same function) ━━━
  // e.preventDefault() + e.stopPropagation() zaroori hain — warna card ka
  // <Link> chal par jayega aur share ke bajaye product page khul jayega.
  // STEP 1 - native share sheet (mobile; WhatsApp isi list me hota hai)
  // STEP 2 - clipboard copy (desktop) + 1.5 sec "Link Copied!" feedback
  // STEP 3 - purana fallback agar clipboard API block ho
  const handleShare = async (e: any, id: string, t: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    const url = window.location.origin + "/product/" + id;

    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share({ title: t || "MultiBrand", url: url });
        return;
      } catch (err: any) {
        if (err && err.name === "AbortError") return;
        // share fail hua — neechy clipboard pe gir jao
      }
    }

    const showCopied = function () {
      setCopiedId(id);
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

  const filtered = activeSub
    ? prods.filter(function (p: any) {
        return p.subCategoryName === activeSub;
      })
    : prods;
  const title = displayName || "Category";

  return (
    <>
      <Head>
        <title>{title} Collection | MultiBrand - Premium Pakistani Suits</title>
        <meta
          name="description"
          content={`Shop premium ${displayName} dresses online. Cash on Delivery available across Pakistan.`}
        />
        <link rel="canonical" href={`https://multibrandstore.vercel.app/category/${encodeURIComponent(rawName)}`} />
      </Head>

      {/* Navbar _app.tsx se globally render hota hai — yahan alag se nahi (double na ho) */}

      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 font-semibold">
              <ArrowLeft size={18} /> Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">{title}</h1>
          </div>

          {/* ━━━ SUB-CATEGORY FILTER CHIPS ━━━ */}
          {subs.length > 0 ? (
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={function () {
                  setActiveSub(null);
                }}
                className={
                  "border px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm capitalize " +
                  (activeSub === null
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-rose-600 hover:text-white hover:border-rose-600")
                }
              >
                All
              </button>
              {subs.map(function (s: any) {
                return (
                  <button
                    key={s._id}
                    onClick={function () {
                      setActiveSub(s.name);
                    }}
                    className={
                      "border px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm capitalize " +
                      (activeSub === s.name
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-rose-600 hover:text-white hover:border-rose-600")
                    }
                  >
                    {s.icon ? <span className="mr-1">{s.icon}</span> : null} {s.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div className="text-center text-gray-500 py-20">
              <div className="w-8 h-8 border-2 border-t-rose-700 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading products...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
              <p className="text-lg font-semibold">No products found in this category.</p>
              <p className="text-sm text-gray-500 mt-2">
                Try another category or add products to the &quot;{displayName}&quot; category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {filtered.map(function (p: any) {
                return (
                  <div key={p.id} className="group">
                    <Link href={"/product/" + p.id}>
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F9F9F9] border border-gray-100">
                        <img
                          src={p.image || p.image2 || "/"}
                          alt={p.title || "Product"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {p.inStock === false ? (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                              SOLD OUT
                            </span>
                          </div>
                        ) : null}
                        {/* ━━━ NAYA: SHARE BUTTON (top-right) — click se product page NAHI khulta ━━━ */}
                        <button
                          type="button"
                          onClick={function (e: any) {
                            handleShare(e, p.id, p.title);
                          }}
                          aria-label="Share product"
                          title="Share"
                          className={
                            "absolute top-2.5 right-2.5 z-30 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 " +
                            (copiedId === p.id
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-900 hover:text-white")
                          }
                        >
                          {copiedId === p.id ? <Check size={15} strokeWidth={2.5} /> : <Share2 size={15} />}
                        </button>
                        {copiedId === p.id ? (
                          <span className="absolute top-14 right-2.5 z-30 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
                            Link Copied!
                          </span>
                        ) : null}
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <button
                            disabled={p.inStock === false}
                            onClick={function (e: any) {
                              e.preventDefault();
                              addToCart({
                                id: p.id,
                                title: p.title,
                                price: Number(p.price),
                                image: p.image,
                                size: p.sizes?.[0] || "Free Size",
                                quantity: 1,
                              });
                            }}
                            className="w-full bg-gray-900 hover:bg-rose-700 text-white py-2.5 text-[11px] font-bold tracking-wider uppercase transition-colors disabled:bg-gray-400"
                          >
                            {p.inStock === false ? "Sold Out" : "Add to Cart"}
                          </button>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 text-left">
                      <Link href={"/product/" + p.id}>
                        <h4 className="text-[13px] font-medium text-gray-800 truncate hover:text-rose-600 transition-colors">
                          {p.title || "Untitled"}
                        </h4>
                      </Link>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{fmt(Number(p.price || 0))}</p>
                      {p.sizes && p.sizes.length > 0 ? (
                        <div className="flex gap-1.5 mt-1.5">
                          {p.sizes.map(function (s: string, i: number) {
                            return (
                              <span key={s} className="text-[9px] text-gray-500 font-medium">
                                {s}
                                {i < p.sizes.length - 1 ? " ·" : ""}
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer ab _app.tsx se globally aata hai (components/Footer.tsx) — yahan alag se nahi (double na ho) */}

      <a
        href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}`}
        target="_blank"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
}