// components/Navbar.tsx — PURANA PURA CODE REPLACE KARO
// Naya: Cart sidebar + checkout components/Cart.tsx me move ho gaya — Navbar sirf cart button dikhata hai
// Baqi sab (mega menu, currency selector, search, mobile menu) pehle jaisa

"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { client } from "../lib/sanity";
import { slugify } from "../lib/site";
import { Menu, X, MessageCircle, ShoppingCart, Search, Heart, ChevronDown, ArrowRight } from "lucide-react";
import { useCart, useCurrency } from "../pages/_app";
import { motion, AnimatePresence } from "framer-motion";
import Cart from "./Cart";

const WA = "923333010842";
const LOGO_URL = "/logo.png";

const dummyCats = [
  { id: "d1", name: "Lawn", icon: "🌸", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600", active: true, subCategories: [] },
  { id: "d2", name: "Chiffon", icon: "✨", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600", active: true, subCategories: [] },
  { id: "d3", name: "Silk", icon: "👗", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600", active: true, subCategories: [] },
  { id: "d4", name: "Fragrance", icon: "🧴", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600", active: true, subCategories: [] },
];

const NAV_CSS =
  "body { font-family: 'DM Sans', sans-serif; } " +
  ".font-display { font-family: 'Cormorant Garamond', serif; } " +
  ".nav-link::after { content:''; display:block; height:1px; background:#1a1a1a; width:0; transition:width 0.3s; } " +
  ".nav-link:hover::after { width:100%; } " +
  ".nav-link-active { color: #1a1a1a !important; } " +
  ".nav-link-active::after { width: 100% !important; } " +
  "@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } " +
  ".marquee-track { animation: marquee 22s linear infinite; }";

export default function Navbar() {
  const router = useRouter();
  const [prods, setProds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const { totalItems } = useCart();
  const { currency, setCurrency, fmt } = useCurrency();
  const [activeNav, setActiveNav] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsQuery = '*[_type == "product"] | order(_createdAt desc) { _id, title, price, "category": category->name, "image": coalesce(image.asset->url, "") }';
        const productsData = await client.fetch(productsQuery);
        setProds(productsData.map((p: any) => ({ ...p, id: p._id })));

        const catsQuery = '*[_type == "category" && active == true] | order(name asc) { _id, name, icon, active, "image": coalesce(image.asset->url, ""), "subCategories": *[_type == "subCategory" && parentCategory._ref == ^._id && active == true] | order(name asc) { _id, name, icon } }';
        const catsData = await client.fetch(catsQuery);
        setCats(catsData.map((c: any) => ({ ...c, id: c._id })));
      } catch (error) {
        console.error("Error fetching navbar data from Sanity:", error);
      }
    };

    fetchData();

    const handleScroll = () => {
      const sections = ["home", "featured", "categories", "about"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) { setActiveNav(id); break; }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("scroll", handleScroll); };
  }, []);

  const displayCats = cats.length > 0 ? cats : dummyCats;

  const searchResults = searchQuery.trim().length > 1
    ? prods.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{NAV_CSS}</style>
      </Head>

      {/* ━━━ ANNOUNCEMENT BAR ━━━ */}
      <div className="bg-[#1a1a1a] text-white py-2.5 overflow-hidden">
        <div className="flex marquee-track whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-[11px] tracking-[0.18em] uppercase mx-10 opacity-80">
              In Karachi, delivery will be done within 1 to 2 days, and in other cities, it will be done within a week. &nbsp;·&nbsp; Cash on Delivery Available &nbsp;·&nbsp; Original Premium Fabrics &nbsp;·&nbsp; 24/7 WhatsApp Support
            </span>
          ))}
        </div>
      </div>

      {/* ━━━ NAVBAR (mega menu iske andar hai — mouse bahar gaya to band ho jata hai) ━━━ */}
      <nav
        className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-100 relative"
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[68px]">
          <button onClick={() => setMenu(true)} className="md:hidden w-9 h-9 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors" aria-label="Open menu">
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <Link href="/" className="flex items-center">
            <img src={LOGO_URL} alt="MultiBrand" className="h-34 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: "Home", href: "/#home", id: "home" },
              { label: "New In", href: "/#featured", id: "featured" },
            ].map(({ label, href, id }) => (
              <Link key={id} href={href} className={"nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 " + (activeNav === id ? "nav-link-active" : "")}>
                {label}
              </Link>
            ))}

            {/* COLLECTIONS — CLICK pe mega menu khulta hai (second navbar ki tarah) */}
            <button
              onClick={() => setMegaOpen(!megaOpen)}
              className={"nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 flex items-center gap-1 " + (megaOpen ? "nav-link-active" : "")}
            >
              Collections
              <ChevronDown size={12} strokeWidth={2} className={"transition-transform duration-300 " + (megaOpen ? "rotate-180" : "")} />
            </button>

            <Link href="/#about" className={"nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 " + (activeNav === "about" ? "nav-link-active" : "")}>
              About
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {/* CURRENCY SELECTOR — PKR / USD */}
            <div className="hidden sm:flex items-center rounded-full border border-gray-200 overflow-hidden mr-1">
              {(["PKR", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={"px-2.5 py-1.5 text-[10px] font-semibold tracking-wider transition-colors " + (currency === cur ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-500 hover:text-gray-900")}
                >
                  {cur}
                </button>
              ))}
            </div>

            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" aria-label="Wishlist">
              <Heart size={18} strokeWidth={1.5} />
            </button>

            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" aria-label="Cart">
              <ShoppingCart size={18} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[#1a1a1a] text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ━━━ MEGA MENU — second navbar (categories + sub-categories) ━━━ */}
        {megaOpen && (
          <div className="hidden md:block absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl shadow-gray-100/80 z-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-7">
                {displayCats.map((c: any) => (
                  <div key={c.id}>
                    <Link
                      href={"/category/" + slugify(c.name)}
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-900 hover:text-rose-600 transition-colors"
                    >
                      <span className="text-base">{c.icon}</span>
                      <span className="capitalize">{c.name}</span>
                    </Link>
                    {c.subCategories && c.subCategories.length > 0 && (
                      <div className="mt-2.5 ml-7 space-y-1.5">
                        {c.subCategories.map((sc: any) => (
                          <Link
                            key={sc._id}
                            href={"/category/" + slugify(c.name) + "/" + slugify(sc.name)}
                            onClick={() => setMegaOpen(false)}
                            className="block text-[12.5px] text-gray-500 hover:text-rose-600 capitalize transition-colors"
                          >
                            {sc.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ━━━ SEARCH MODAL ━━━ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-start justify-center pt-20 px-4" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center border-b border-gray-100 px-5">
                <Search size={18} className="text-gray-400" strokeWidth={1.5} />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for dresses, categories..." className="w-full px-4 py-5 text-gray-900 bg-transparent focus:outline-none text-[15px]" />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-400 hover:text-gray-700"><X size={18} strokeWidth={1.5} /></button>
              </div>

              {searchQuery.length > 1 && (
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {searchResults.length === 0 ? (
                    <p className="p-6 text-center text-gray-400 text-sm">No products found for "<span className="text-gray-700 font-medium">{searchQuery}</span>"</p>
                  ) : (
                    searchResults.map(p => (
                      <Link key={p.id} href={"/product/" + p.id} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{p.title}</h4>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{p.category} · {fmt(Number(p.price))}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300" />
                      </Link>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ MOBILE MENU ━━━ */}
      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex" onClick={() => setMenu(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }}
              className="relative w-[300px] bg-white h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <img src={LOGO_URL} alt="MultiBrand" className="h-8" />
                <button onClick={() => setMenu(false)} className="text-gray-400 hover:text-gray-700"><X size={18} strokeWidth={1.5} /></button>
              </div>
              <nav className="p-6 space-y-1 flex-1 overflow-y-auto">
                <button onClick={() => { setMenu(false); setSearchOpen(true); }} className="flex items-center gap-3 py-3 text-[15px] font-medium text-gray-800 border-b border-gray-50 hover:text-rose-600 transition-colors w-full text-left">
                  <Search size={16} strokeWidth={1.5} /> Search
                </button>
                {[{ label: "Home", href: "/#home" }, { label: "New In", href: "/#featured" }, { label: "About", href: "/#about" }].map(({ label, href }) => (
                  <Link key={label} href={href} onClick={() => setMenu(false)} className="block py-3 text-[15px] font-medium text-gray-800 border-b border-gray-50 hover:text-rose-600 transition-colors">{label}</Link>
                ))}

                {/* MOBILE CURRENCY SELECTOR */}
                <div className="pt-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-2">Currency</p>
                  <div className="flex gap-2">
                    {(["PKR", "USD"] as const).map((cur) => (
                      <button
                        key={cur}
                        onClick={() => setCurrency(cur)}
                        className={"flex-1 py-2.5 rounded-lg text-[12px] font-medium border transition-all " + (currency === cur ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}
                      >
                        {cur === "PKR" ? "PKR Rs" : "USD $"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MOBILE MENU COLLECTIONS WITH SUB-CATEGORIES */}
                <div className="pt-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">Collections</p>
                  {displayCats.map((c: any) => (
                    <div key={c.id}>
                      <Link href={"/category/" + slugify(c.name)} onClick={() => setMenu(false)} className="flex items-center gap-3 py-2 text-[14px] font-medium text-gray-800 hover:text-rose-600 transition-colors">
                        <span>{c.icon}</span> {c.name}
                      </Link>
                      {c.subCategories && c.subCategories.length > 0 && (
                        <div className="pl-8 pb-1">
                          {c.subCategories.map((sc: any) => (
                            <Link key={sc._id} href={"/category/" + slugify(c.name) + "/" + slugify(sc.name)} onClick={() => setMenu(false)} className="block py-1 text-[12px] text-gray-500 hover:text-rose-600 capitalize transition-colors">
                              {sc.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </nav>
              <div className="p-5 border-t border-gray-100">
                <a href={"https://wa.me/" + WA} target="_blank" className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <MessageCircle size={16} /> WhatsApp Support
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ CART (components/Cart.tsx — sidebar + checkout + delivery charges sab usme) ━━━ */}
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}