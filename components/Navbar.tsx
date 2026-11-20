// components/Navbar.tsx
// PURANA PURA CODE REPLACE KARO
// Is version me: 1) dummy cats delete  2) emojis delete (strip + mega menu sirf clean text)
// 3) main nav links dark (gray-900), category strip light (gray-400) — dono me shade farq
// 4) strip pe halka bg shade  5) PKR/USD toggle me active ka clear farq
// 6) Collections dropdown me SUB-CATEGORIES bhi (category heading dark + subs light, no emoji)

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { client } from "../lib/sanity";
import { Menu, X, Search, Heart, ShoppingCart, ChevronDown } from "lucide-react";
import { useCart, useCurrency } from "../pages/_app";
import Cart from "./Cart";

const ANNOUNCE =
  '"In Karachi, delivery will be done within 1 to 2 days, and in other cities, it will be done within a week."  ·  Cash on Delivery Available  ·  Original Premium Fabrics  ·  24/7 WhatsApp Support';

const NAV_CSS =
  "@keyframes mbsMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } " +
  ".marquee-track { animation: mbsMarquee 22s linear infinite; } " +
  ".nav-link::after { content: \"\"; display: block; height: 1px; background: #1a1a1a; width: 0; transition: width 0.3s; } " +
  ".nav-link:hover::after { width: 100%; } " +
  ".nav-link-active { color: #1a1a1a !important; } " +
  ".nav-link-active::after { width: 100% !important; } " +
  ".no-bar { scrollbar-width: none; -ms-overflow-style: none; } " +
  ".no-bar::-webkit-scrollbar { display: none; }";

const CATS_GROQ =
  '*[_type == "category" && active == true] | order(name asc) { _id, name, icon, active, "image": coalesce(image.asset->url, ""), "subCategories": *[_type == "subCategory" && parentCategory._ref == ^._id && active == true] | order(name asc) { _id, name, icon } }';

const SEARCH_GROQ =
  '*[_type == "product"] | order(_createdAt desc) { _id, title, price, "image": coalesce(image.asset->url, "") }';

// URL safe slug: "Embroidered Lawn Suits" -> "embroidered-lawn-suits"
// Category page isi tarah match karta hai (case aur spaces dono handle)
function slugify(s: string): string {
  const lowered = String(s || "").toLowerCase().replace(/-/g, " ");
  let cleaned = "";
  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered.charAt(i);
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === " ") {
      cleaned += ch;
    }
  }
  return cleaned.replace(/\s+/g, " ").trim().replace(/\s+/g, "-");
}

export default function Navbar() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const { totalItems } = useCart();
  const { currency, setCurrency, fmt } = useCurrency();

  // Real categories sirf Sanity se — koi dummy data nahi
  useEffect(() => {
    client
      .fetch(CATS_GROQ)
      .then(function (d: any[]) {
        setCats(d || []);
      })
      .catch(function () {});
  }, []);

  // Search modal pehli dafa khulne pe products ek bar fetch
  useEffect(() => {
    if (!searchOpen || allProducts.length > 0) return;
    client
      .fetch(SEARCH_GROQ)
      .then(function (d: any[]) {
        setAllProducts(d || []);
      })
      .catch(function () {});
  }, [searchOpen, allProducts.length]);

  const query = searchQuery.trim().toLowerCase();
  const results =
    query === ""
      ? []
      : allProducts
          .filter(function (p: any) {
            return String(p.title || "").toLowerCase().indexOf(query) !== -1;
          })
          .slice(0, 8);

  // /category/xyz pe ho to strip me wahi category highlight
  const activeCat = slugify(
    router.asPath.indexOf("/category/") === 0
      ? (router.asPath.split("/")[2] || "").split("?")[0].split("#")[0]
      : ""
  );

  // Main nav links — DARK shade (primary row)
  const navMain =
    "nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-900 hover:text-black transition-colors pb-0.5";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />

      {/* Announcement marquee bar */}
      <div className="bg-[#1a1a1a] text-white py-2.5 overflow-hidden">
        <div className="flex marquee-track whitespace-nowrap">
          {[0, 1, 2, 3, 4, 5].map(function (i: number) {
            return (
              <span
                key={i}
                className="text-[11px] tracking-[0.18em] uppercase mx-10 opacity-80"
              >
                {ANNOUNCE}
              </span>
            );
          })}
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-white backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Open menu"
              onClick={function () {
                setMobileOpen(true);
              }}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="MultiBrand" className="h-34 w-auto" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className={navMain}>
              Home
            </Link>
            <Link href="/#featured" className={navMain}>
              New In
            </Link>

            <div className="relative group">
              <button className={navMain + " flex items-center gap-1"}>
                Collections
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
              </button>
              {cats.length > 0 ? (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[760px] max-w-[92vw] bg-white border border-gray-100 shadow-xl shadow-gray-100/80 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-5 px-6 origin-top scale-95 group-hover:scale-100">
                  <div className="grid grid-cols-5 gap-x-6">
                    {cats.map(function (c: any) {
                      return (
                        <div key={c._id} className="min-w-0">
                          <Link
                            href={"/category/" + slugify(String(c.name || ""))}
                            className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-900 hover:text-black transition-colors pb-2 border-b border-gray-100"
                          >
                            {c.name}
                          </Link>
                          {c.subCategories && c.subCategories.length > 0 ? (
                            <div className="mt-2.5 space-y-1.5">
                              {c.subCategories.map(function (s: any) {
                                return (
                                  <Link
                                    key={s._id}
                                    href={
                                      "/category/" +
                                      slugify(String(s.name || ""))
                                    }
                                    className="block text-[12px] text-gray-400 hover:text-gray-800 transition-colors capitalize leading-snug"
                                  >
                                    {s.name}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <Link href="/#about" className={navMain}>
              About
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {/* Currency toggle — active dark pill, inactive light: dono me clear farq */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                onClick={function () {
                  setCurrency("PKR");
                }}
                className={
                  "px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.08em] transition-colors " +
                  (currency === "PKR"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-800")
                }
              >
                PKR
              </button>
              <button
                onClick={function () {
                  setCurrency("USD");
                }}
                className={
                  "px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.08em] transition-colors " +
                  (currency === "USD"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-800")
                }
              >
                USD
              </button>
            </div>

            <button
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Search"
              onClick={function () {
                setSearchOpen(true);
              }}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <button
              className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={18} strokeWidth={1.5} />
            </button>

            <button
              className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Cart"
              onClick={function () {
                setCartOpen(true);
              }}
            >
              <ShoppingCart size={18} strokeWidth={1.5} />
              {totalItems ? (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#1a1a1a] text-white text-[9px] font-semibold flex items-center justify-center">
                  {totalItems}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* ━━━ CATEGORY STRIP — halka bg shade + LIGHT text (main nav se farq) ━━━ */}
        {cats.length > 0 ? (
          <div className="bg-[#FAFAF9] border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
              <div className="no-bar flex items-center gap-7 h-[42px] overflow-x-auto whitespace-nowrap md:justify-center">
                {cats.map(function (c: any) {
                  return (
                    <Link
                      key={c._id}
                      href={"/category/" + slugify(String(c.name || ""))}
                      className={
                        "nav-link flex-shrink-0 text-[11.5px] font-medium tracking-[0.14em] uppercase text-gray-400 hover:text-gray-800 transition-colors " +
                        (activeCat === slugify(String(c.name || ""))
                          ? "nav-link-active"
                          : "")
                      }
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {/* ━━━ SEARCH MODAL ━━━ */}
      {searchOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-black/40"
          onClick={function () {
            setSearchOpen(false);
          }}
        >
          <div
            className="max-w-2xl mx-auto mt-20 bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={function (e: any) {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center gap-3 px-5 border-b border-gray-100">
              <Search size={18} strokeWidth={1.5} className="text-gray-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={function (e: any) {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search Lawn, Chiffon, Silk, Fragrance..."
                className="flex-1 py-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                onClick={function () {
                  setSearchOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="Close search"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {query === "" ? (
                <p className="px-5 py-8 text-center text-[13px] text-gray-400">
                  Type to search products
                </p>
              ) : results.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-gray-400">
                  {allProducts.length === 0
                    ? "Loading products..."
                    : "No products found"}
                </p>
              ) : (
                results.map(function (p: any) {
                  return (
                    <Link
                      key={p._id}
                      href={"/product/" + p._id}
                      onClick={function () {
                        setSearchOpen(false);
                      }}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                    >
                      {p.image ? (
                        <img
                          src={String(p.image)}
                          alt={String(p.title || "")}
                          className="w-12 h-12 object-cover rounded bg-gray-100"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded bg-gray-100 block" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-medium text-gray-900 truncate">
                          {p.title}
                        </span>
                        <span className="block text-[12px] text-gray-400 mt-0.5">
                          {fmt(Number(p.price || 0))}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ━━━ MOBILE MENU ━━━ */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={function () {
              setMobileOpen(false);
            }}
          />
          <div className="absolute top-0 left-0 bottom-0 w-[290px] bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-gray-100">
              <img src="/logo.png" alt="MultiBrand" className="h-8 w-auto" />
              <button
                onClick={function () {
                  setMobileOpen(false);
                }}
                className="w-9 h-9 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 py-5">
              <Link
                href="/"
                onClick={function () {
                  setMobileOpen(false);
                }}
                className="block py-3 text-[13px] font-medium tracking-[0.14em] uppercase text-gray-900 border-b border-gray-50"
              >
                Home
              </Link>
              <Link
                href="/#featured"
                onClick={function () {
                  setMobileOpen(false);
                }}
                className="block py-3 text-[13px] font-medium tracking-[0.14em] uppercase text-gray-900 border-b border-gray-50"
              >
                New In
              </Link>
              <Link
                href="/#about"
                onClick={function () {
                  setMobileOpen(false);
                }}
                className="block py-3 text-[13px] font-medium tracking-[0.14em] uppercase text-gray-900 border-b border-gray-50"
              >
                About
              </Link>

              {cats.length > 0 ? (
                <>
                  <p className="mt-6 mb-1 text-[10px] font-medium tracking-[0.2em] uppercase text-gray-400">
                    Collections
                  </p>
                  {cats.map(function (c: any) {
                    return (
                      <div key={c._id} className="border-b border-gray-50">
                        <Link
                          href={"/category/" + slugify(String(c.name || ""))}
                          onClick={function () {
                            setMobileOpen(false);
                          }}
                          className="block py-2.5 text-[12.5px] font-medium text-gray-400 hover:text-gray-800 transition-colors capitalize"
                        >
                          {c.name}
                        </Link>
                        {c.subCategories && c.subCategories.length > 0 ? (
                          <div className="ml-0.5 pl-3 pb-2 space-y-0.5 border-l-2 border-gray-100">
                            {c.subCategories.map(function (s: any) {
                              return (
                                <Link
                                  key={s._id}
                                  href={
                                    "/category/" +
                                    slugify(String(s.name || ""))
                                  }
                                  onClick={function () {
                                    setMobileOpen(false);
                                  }}
                                  className="block py-1 text-[12px] text-gray-400 hover:text-gray-800 transition-colors capitalize"
                                >
                                  {s.name}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              ) : null}

              <p className="mt-6 mb-2 text-[10px] font-medium tracking-[0.2em] uppercase text-gray-400">
                Currency
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={function () {
                    setCurrency("PKR");
                  }}
                  className={
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.08em] transition-colors " +
                    (currency === "PKR"
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:text-gray-800")
                  }
                >
                  PKR
                </button>
                <button
                  onClick={function () {
                    setCurrency("USD");
                  }}
                  className={
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.08em] transition-colors " +
                    (currency === "USD"
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:text-gray-800")
                  }
                >
                  USD
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Cart
        open={cartOpen}
        onClose={function () {
          setCartOpen(false);
        }}
      />
    </>
  );
}