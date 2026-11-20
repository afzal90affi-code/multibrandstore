// pages/index.tsx — PURANA PURA CODE REPLACE KARO
// Badlav:
// 1. Category tiles ke links ab slugified hain (/category/embroidered-lawn type) —
//    404 khatam, naya pages/category/[name].tsx page khulta hai
// 2. Subcategory ke naam bhi ab clickable links hain (/category/<cat>/<sub>)
// 3. Featured product cards ki IMAGE ab bhi clickable hai — product page khulta hai
// 4. Signature Silk banner ka link ab /category/silk (chalta hai)
// 5. Currency system waise hi hai (useCurrency + fmt)
// 6. NAYA: Featured product cards pe SHARE BUTTON (image ke upar, top-right me
//    heart ke bagal me). Mobile pe native share sheet (WhatsApp bhi isi me),
//    desktop pe link copy + 1.5 sec green button + "Link Copied!" chip.
//    Share click se product page NAHI khulta — sirf share hota hai.
//    NOTE: yahan ProductCard component use NAHI ho raha (cards inline hain),
//    is liye share button yahan alag se add kiya gaya hai.

"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { client } from "../lib/sanity";
import { MessageCircle, ArrowRight, Shield, Truck, Star, Heart, Sparkles, X, Share2, Check } from "lucide-react";
import { useCart, useCurrency } from "./_app";
import { motion, AnimatePresence } from "framer-motion";

const WA = "923333010842";
const LOGO_URL = "/logo.png";
const SITE_URL = "https://multibrandstore.vercel.app";

const dummyCats = [
  { id: "d1", name: "Lawn", icon: "🌸", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600", active: true, subCategories: [] },
  { id: "d2", name: "Chiffon", icon: "✨", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600", active: true, subCategories: [] },
  { id: "d3", name: "Silk", icon: "👗", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600", active: true, subCategories: [] },
  { id: "d4", name: "Fragrance", icon: "🧴", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600", active: true, subCategories: [] },
];

// Category/subcategory ka naam clean URL slug banata hai:
// "embroidered lawn" -> "embroidered-lawn", "co'ords" -> "coords"
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
}

const PAGE_CSS =
  "body { font-family: 'DM Sans', sans-serif; } " +
  ".font-display { font-family: 'Cormorant Garamond', serif; } " +
  ".nav-link-active { color: #1a1a1a !important; } " +
  ".nav-link-active::after { width: 100% !important; } " +
  ".nav-link::after { content:''; display:block; height:1px; background:#1a1a1a; width:0; transition:width 0.3s; } " +
  ".nav-link:hover::after { width:100%; } " +
  "@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } " +
  ".marquee-track { animation: marquee 22s linear infinite; } " +
  ".product-card:hover .product-overlay { opacity:1; } " +
  ".product-card:hover .product-img-main { transform:scale(1.04); } " +
  ".product-card:hover .product-img-alt { opacity:1; } " +
  "@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }";

export default function Home() {
  const [prods, setProds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const { addToCart } = useCart();
  const { fmt } = useCurrency();
  const [showLead, setShowLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", city: "", need: "" });
  const [wishlist, setWishlist] = useState<string[]>([]);
  // NAYA: kis card ka link copy hua hai (green button + chip usi card pe dikhega)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsQuery = '*[_type == "product"] | order(_createdAt desc) { _id, title, price, sizes, featured, inStock, "category": category->name, "image": coalesce(image.asset->url, ""), "image2": coalesce(image2.asset->url, "") }';
        const productsData = await client.fetch(productsQuery);
        setProds(productsData.map((p: any) => ({ ...p, id: p._id })));

        const catsQuery = '*[_type == "category" && active == true] | order(name asc) { _id, name, icon, active, "image": coalesce(image.asset->url, ""), "subCategories": *[_type == "subCategory" && parentCategory._ref == ^._id && active == true] | order(name asc) { _id, name, icon } }';
        const catsData = await client.fetch(catsQuery);
        setCats(catsData.map((c: any) => ({ ...c, id: c._id })));
      } catch (error) {
        console.error("Error fetching data from Sanity:", error);
      }
    };

    fetchData();

    const timer = setTimeout(() => {
      if (!localStorage.getItem("fd_lead")) setShowLead(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const closeLead = () => { setShowLead(false); localStorage.setItem("fd_lead", "1"); };

  const saveLead = async () => {
    if (!leadForm.name.trim() || !leadForm.phone.trim()) return;
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, source: "popup" }),
      });
      closeLead();
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const featured = prods.filter((p: any) => p.featured).slice(0, 8);
  const displayCats = cats.length > 0 ? cats : dummyCats;

  const handleAddToCart = (p: any) => {
    addToCart({ id: p.id, title: p.title, price: Number(p.price), image: p.image, size: p.sizes?.[0] || "Free Size", quantity: 1 });
  };

  // ━━━ NAYA: SHARE HANDLER ━━━
  // e.preventDefault() + e.stopPropagation() zaroori hain — warna card ka
  // <Link> chal par jayega aur share ke bajaye product page khul jayega.
  // STEP 1 - native share sheet (mobile; WhatsApp isi list me hota hai)
  // STEP 2 - clipboard copy (desktop) + 1.5 sec "Link Copied!" feedback
  // STEP 3 - purana fallback agar clipboard API block ho
  const handleShare = async (e: any, p: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.id) return;
    const url = window.location.origin + "/product/" + p.id;

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
      setCopiedId(p.id);
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MultiBrand",
    "url": SITE_URL,
    "description": "Premium Pakistani Ladies Dresses - Lawn, Chiffon, Silk & Fragrance."
  };

  return (
    <>
      <Head>
        <title>MultiBrand | Premium Pakistani suits & Fragrance</title>
        <meta name="description" content="Shop premium Pakistani Lawn, Chiffon, Silk suits and Fragrances online. Cash on Delivery available across Pakistan." />
        <meta name="keywords" content="Pakistani suits, Lawn dresses, Chiffon, Silk, Fragrance, MultiBrand, COD Pakistan" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content="MultiBrand | Premium Pakistani Suits" />
        <meta property="og:description" content="Elegant Lawn, Luxurious Chiffon & Pure Silk. COD Available." />
        <meta property="og:image" content={LOGO_URL} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <style>{PAGE_CSS}</style>
      </Head>

      {/* ━━━ HERO ━━━ */}
      <section id="home" className="relative overflow-hidden bg-[#0d0d0d] min-h-[55vh] sm:min-h-[70vh] md:min-h-[92vh] flex items-end">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-12 sm:pb-20 w-full">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-rose-400"></div>
              <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-rose-400">New Collection 2025</span>
            </div>
            <h1 className="font-display font-light text-white leading-[1.05]">
              <span className="block text-4xl sm:text-6xl md:text-8xl italic">Premium</span>
              <span className="block text-4xl sm:text-6xl md:text-8xl font-normal tracking-tight mt-1">Pakistani Suits</span>
            </h1>
            <p className="text-gray-300/80 text-sm sm:text-base mt-5 max-w-sm font-light leading-relaxed">
              Lawn, Chiffon, Pure Silk & Exclusive Fragrances.<br />
              <span className="text-white/60 text-xs tracking-wider">Cash on Delivery across Pakistan.</span>
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#featured" className="group inline-flex items-center gap-2.5 bg-white text-gray-900 font-medium px-7 py-3.5 rounded-full text-[12.5px] tracking-wider uppercase hover:bg-rose-50 transition-colors shadow-xl shadow-black/20">
                Shop Now <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#categories" className="inline-flex items-center gap-2.5 border border-white/25 text-white font-medium px-7 py-3.5 rounded-full text-[12.5px] tracking-wider uppercase hover:bg-white/10 transition-colors backdrop-blur-sm">
                Browse Collections
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ FEATURED PRODUCTS ━━━ */}
      {featured.length > 0 && (
        <section id="featured" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-rose-500">Handpicked</span>
                <h2 className="font-display text-3xl md:text-5xl font-light mt-1 text-gray-900">New <em>Arrivals</em></h2>
              </div>
              <a href="#categories" className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase font-medium text-gray-500 hover:text-gray-900 transition-colors">
                View All <ArrowRight size={12} />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
              {featured.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
                  className="product-card group cursor-pointer">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#F6F4F2] rounded-sm">
                    {/* Pura image clickable — click karne pe product page khulta hai */}
                    <Link href={"/product/" + p.id} className="absolute inset-0 z-10" aria-label={p.title}></Link>
                    <img src={p.image} alt={p.title} className="product-img-main w-full h-full object-cover transition-transform duration-700" />
                    {p.image2 && (
                      <img src={p.image2} alt="" className="product-img-alt absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500" />
                    )}

                    {/* ━━━ NAYA: SHARE BUTTON — hamesha visible (mobile-friendly), heart ke bagal me ━━━ */}
                    <button onClick={(e) => handleShare(e, p)}
                      className={"absolute top-3 right-12 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm " +
                        (copiedId === p.id ? "bg-green-600 text-white" : "bg-white/90 text-gray-700 hover:text-gray-900")}
                      aria-label="Share product" title="Share">
                      {copiedId === p.id ? <Check size={14} strokeWidth={2.5} /> : <Share2 size={14} strokeWidth={1.5} />}
                    </button>
                    {copiedId === p.id && (
                      <span className="absolute top-12 right-3 z-20 bg-gray-900 text-white text-[9px] font-semibold tracking-wide px-2 py-1 rounded-full">Link Copied!</span>
                    )}

                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p.id); }}
                      className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm">
                      <Heart size={14} strokeWidth={1.5} className={wishlist.includes(p.id) ? "fill-rose-500 stroke-rose-500" : "stroke-gray-600"} />
                    </button>

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
                    <Link href={"/product/" + p.id}>
                      <h4 className="text-[13px] font-medium text-gray-800 leading-snug hover:text-rose-600 transition-colors line-clamp-2">{p.title}</h4>
                    </Link>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[13.5px] font-semibold text-gray-900">{fmt(Number(p.price) || 0)}</span>
                    </div>
                    {p.sizes?.length > 0 && (
                      <p className="text-[15px] text-gray-400 mt-1 tracking-wide">{p.sizes.join(" · ")}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━ EDITORIAL BANNER ━━━ */}
      <section className="relative overflow-hidden h-[260px] sm:h-[380px] md:h-[440px] bg-[#1a0a0a]">
        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1400" alt="Collection banner"
          className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0a]/80 via-transparent to-[#1a0a0a]/30" />
        <div className="relative h-full flex items-center max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ x: -30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <span className="text-[10px] tracking-[0.3em] uppercase text-rose-400 font-medium">Exclusive</span>
            <h3 className="font-display text-3xl sm:text-5xl font-light text-white mt-2 leading-tight">
              Signature <em>Silk</em><br />Collection
            </h3>
            <Link href="/category/silk" className="inline-flex items-center gap-2 mt-6 text-[11.5px] tracking-[0.18em] uppercase font-medium text-white border-b border-white/40 pb-0.5 hover:border-rose-400 hover:text-rose-300 transition-colors">
              Explore Now <ArrowRight size={12} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━ CATEGORIES GRID ━━━ */}
      <section id="categories" className="py-16 md:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-rose-500">Explore</span>
            <h2 className="font-display text-3xl md:text-5xl font-light text-gray-900 mt-2">Shop by <em>Category</em></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {displayCats.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
                className="product-card group cursor-pointer">

                <div className="relative aspect-[3/4] overflow-hidden bg-[#F6F4F2] rounded-sm">
                  <Link href={"/category/" + slugify(c.name)} className="absolute inset-0 z-10" aria-label={c.name}></Link>

                  <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                  <div className="product-overlay absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300 pointer-events-none">
                    <span className="block w-full bg-white/95 backdrop-blur-sm text-gray-900 py-2.5 text-[10.5px] font-semibold tracking-[0.12em] uppercase text-center rounded-sm">
                      Explore
                    </span>
                  </div>
                </div>

                <div className="mt-3.5">
                  <Link href={"/category/" + slugify(c.name)}>
                    <h3 className="text-[19px] font-medium text-gray-800 leading-snug hover:text-rose-600 transition-colors line-clamp-2">
                      {c.icon} {c.name}
                    </h3>
                  </Link>

                  {c.subCategories && c.subCategories.length > 0 && (
                    <p className="text-[15px] text-gray-400 mt-1 tracking-wide">
                      {c.subCategories.map((sc: any, idx: number) => (
                        <span key={sc._id || idx}>
                          {idx > 0 ? " · " : ""}
                          <Link href={"/category/" + slugify(c.name) + "/" + slugify(sc.name)} className="hover:text-gray-600 transition-colors">
                            {sc.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TRUST SECTION ━━━ */}
      <section className="py-12 md:py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          {[
            { icon: <Truck size={22} strokeWidth={1.5} />, title: "Delivery Apply", sub: "All orders" },
            { icon: <Shield size={22} strokeWidth={1.5} />, title: "COD Available", sub: "Pay when you receive" },
            { icon: <Star size={22} strokeWidth={1.5} />, title: "Original Fabrics", sub: "100% authentic quality" },
            { icon: <MessageCircle size={22} strokeWidth={1.5} />, title: "24/7 Support", sub: "Always here for you" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">{icon}</div>
              <div>
                <h4 className="font-semibold text-[13px] text-gray-900">{title}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ ABOUT ━━━ */}
      <section id="about" className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-rose-500">Our Story</span>
          <h2 className="font-display text-3xl md:text-5xl font-light text-gray-900 mt-3 mb-6 leading-tight">
            Pakistan's Trusted<br /><em>Fashion Destination</em>
          </h2>
          <p className="text-gray-500 leading-relaxed text-[14.5px]">
            We bring you premium quality suits — Lawn, Chiffon, Silk & Fragrances. Curated with care, every product is original and crafted for the discerning Pakistani woman. Cash on Delivery available across the country.
          </p>
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-10 h-px bg-gray-200"></div>
            <Sparkles size={14} className="text-rose-400" strokeWidth={1.5} />
            <div className="w-10 h-px bg-gray-200"></div>
          </div>
        </div>
      </section>


      {/* ━━━ LEAD POPUP ━━━ */}
      <AnimatePresence>
        {showLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={closeLead}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.92, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, y: 16, opacity: 0 }} transition={{ type: "spring", damping: 26 }}
              className="relative w-full max-w-[360px] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-28 bg-[#1a0a0a] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600" alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <button onClick={closeLead} className="absolute top-3 right-3 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors">
                  <X size={14} strokeWidth={2} />
                </button>
                <div className="absolute bottom-4 left-5">
                  <span className="text-[9px] tracking-[0.22em] uppercase text-rose-300 font-medium">Exclusive Offer</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl font-medium text-gray-900 leading-snug">Stay ahead of<br /><em>new arrivals</em></h3>
                <p className="text-[12px] text-gray-400 mt-1.5 mb-5">Get deal alerts straight to your WhatsApp.</p>
                <div className="space-y-2.5">
                  <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Your Name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                  <input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="WhatsApp Number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                  <button onClick={saveLead} className="w-full bg-[#1a1a1a] hover:bg-rose-700 text-white font-medium py-3 rounded-xl text-[12.5px] tracking-wider uppercase transition-colors">
                    Subscribe →
                  </button>
                </div>
                <button onClick={closeLead} className="block text-center w-full mt-3 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">No thanks</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ WA FAB ━━━ */}
      <motion.a href={"https://wa.me/" + WA + "?text=" + encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")} target="_blank" aria-label="WhatsApp"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2, type: "spring" }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30 hover:scale-110 transition-transform"
        style={{ width: 52, height: 52 }}>
        <MessageCircle size={24} strokeWidth={1.5} />
      </motion.a>
    </>
  );
}