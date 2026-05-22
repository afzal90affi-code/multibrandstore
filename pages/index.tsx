"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router"; // ✅ Router import kiya
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Menu, X, MessageCircle, ArrowRight, ShoppingCart, Shield, Truck, Tag, Banknote, Building, Trash2, Search, Heart, ChevronDown, Sparkles, Star } from "lucide-react";
import { useCart } from "./_app";
import { motion, AnimatePresence } from "framer-motion";

const WA = "923333010842";
const LOGO_URL = "/logo.png";
const SITE_URL = "https://yourdomain.com";

const dummyCats = [
  { id: "d1", name: "Lawn", icon: "🌸", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600", active: true },
  { id: "d2", name: "Chiffon", icon: "✨", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600", active: true },
  { id: "d3", name: "Silk", icon: "👗", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600", active: true },
  { id: "d4", name: "Fragrance", icon: "🧴", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600", active: true },
];

export default function Home() {
  const router = useRouter(); // ✅ Router use kiya
  const [prods, setProds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, addToCart, removeFromCart, updateQty, totalItems, totalPrice, placeOrder } = useCart();
  const [showLead, setShowLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", city: "", need: "" });
  const [checkout, setCheckout] = useState({ name: "", phone: "", city: "", address: "", payment: "COD" });
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeNav, setActiveNav] = useState("");
  
  // ✅ Search States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "products"), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProds(data);
    });
    const unsub2 = onSnapshot(collection(db, "categories"), (s) =>
      setCats(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c: any) => c.active !== false))
    );
    const timer = setTimeout(() => {
      if (!localStorage.getItem("fd_lead")) setShowLead(true);
    }, 10000);

    const handleScroll = () => {
      const sections = ["home", "featured", "categories", "about"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) { setActiveNav(id); break; }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => { unsub1(); unsub2(); clearTimeout(timer); window.removeEventListener("scroll", handleScroll); };
  }, []);

  const closeLead = () => { setShowLead(false); localStorage.setItem("fd_lead", "1"); };
  const saveLead = async () => {
    if (!leadForm.name.trim() || !leadForm.phone.trim()) return;
    await addDoc(collection(db, "leads"), { ...leadForm, createdAt: serverTimestamp(), source: "popup" });
    closeLead();
  };
  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const featured = prods.filter((p: any) => p.featured).slice(0, 8);
  const displayCats = cats.length > 0 ? cats : dummyCats;

  const handleAddToCart = (p: any) => {
    addToCart({ id: p.id, title: p.title, price: Number(p.price), image: p.image, size: p.sizes?.[0] || "Free Size", quantity: 1 });
  };

  // ✅ Search Results Logic (Filters from loaded products)
  const searchResults = searchQuery.trim().length > 1 
    ? prods.filter(p => 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8) 
    : [];

  const handlePlaceOrder = () => {
    if (!checkout.name || !checkout.phone || !checkout.city || !checkout.address) {
      alert("Please fill all fields");
      return;
    }

    const itemLines = items.map((item, i) =>
      `*${i + 1}. ${item.title}*\n` +
      `   Size: ${item.size} | Qty: ${item.quantity} | PKR ${(item.price * item.quantity).toLocaleString()}\n` +
      `   🔗 Product: ${SITE_URL}/product/${item.id}\n` +
      `   🖼️ Image: ${item.image}`
    ).join("\n\n");

    const message =
      `🛍️ *New Order — MultiBrand*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `${itemLines}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `💰 *Total: PKR ${totalPrice.toLocaleString()}*\n` +
      `💳 Payment: ${checkout.payment}\n\n` +
      `👤 *Customer Details*\n` +
      `Name: ${checkout.name}\n` +
      `Phone: ${checkout.phone}\n` +
      `City: ${checkout.city}\n` +
      `Address: ${checkout.address}`;

    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`, "_blank");
    
    setCheckout({ name: "", phone: "", city: "", address: "", payment: "COD" });
    // ✅ Order ke baad Home Page par redirect kare
    router.push("/");
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
        <style>{`
          body { font-family: 'DM Sans', sans-serif; }
          .font-display { font-family: 'Cormorant Garamond', serif; }
          .nav-link-active { color: #1a1a1a !important; }
          .nav-link-active::after { width: 100% !important; }
          .nav-link::after { content:''; display:block; height:1px; background:#1a1a1a; width:0; transition:width 0.3s; }
          .nav-link:hover::after { width:100%; }
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          .marquee-track { animation: marquee 22s linear infinite; }
          .product-card:hover .product-overlay { opacity:1; }
          .product-card:hover .product-img-main { transform:scale(1.04); }
          .product-card:hover .product-img-alt { opacity:1; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </Head>

      {/* ━━━ ANNOUNCEMENT BAR ━━━ */}
      <div className="bg-[#1a1a1a] text-white py-2.5 overflow-hidden">
        <div className="flex marquee-track whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-[11px] tracking-[0.18em] uppercase mx-10 opacity-80">
              "In Karachi, delivery will be done within 1 to 2 days, and in other cities, it will be done within a week." &nbsp;·&nbsp; Cash on Delivery Available &nbsp;·&nbsp; Original Premium Fabrics &nbsp;·&nbsp; 24/7 WhatsApp Support
            </span>
          ))}
        </div>
      </div>

      {/* ━━━ NAVBAR ━━━ */}
      <nav className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[68px]">
          <button onClick={() => setMenu(true)} className="md:hidden w-9 h-9 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors" aria-label="Open menu">
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <Link href="/" className="flex items-center">
            <img src={LOGO_URL} alt="MultiBrand" className="h-34 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: "Home", href: "#home", id: "home" },
              { label: "New In", href: "#featured", id: "featured" },
            ].map(({ label, href, id }) => (
              <a key={id} href={href} className={`nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 ${activeNav === id ? "nav-link-active" : ""}`}>
                {label}
              </a>
            ))}

            <div className="relative group">
              <button className={`nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 flex items-center gap-1 ${activeNav === "categories" ? "nav-link-active" : ""}`}>
                Collections <ChevronDown size={12} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white border border-gray-100 shadow-xl shadow-gray-100/80 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-1.5 origin-top scale-95 group-hover:scale-100">
                {displayCats.map((c) => (
                  <Link key={c.id} href={`/category/${c.name}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <span className="text-base">{c.icon}</span>
                    <span className="text-[12.5px] font-medium text-gray-700 capitalize tracking-wide">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <a href="#about" className={`nav-link text-[12px] font-medium tracking-[0.14em] uppercase text-gray-500 hover:text-gray-900 transition-colors pb-0.5 ${activeNav === "about" ? "nav-link-active" : ""}`}>
              About
            </a>
          </div>

          <div className="flex items-center gap-1">
            {/* ✅ SEARCH BUTTON */}
            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" aria-label="Wishlist">
              <Heart size={18} strokeWidth={1.5} />
            </button>
            
            {/* ✅ CART BUTTON (No Link, just opens cart) */}
            <button 
              onClick={() => setCartOpen(true)} 
              className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors" 
              aria-label="Cart"
            >
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
      </nav>

      {/* ━━━ SEARCH MODAL ━━━ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-start justify-center pt-20 px-4" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              {/* Search Input */}
              <div className="flex items-center border-b border-gray-100 px-5">
                <Search size={18} className="text-gray-400" strokeWidth={1.5} />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for dresses, categories..."
                  className="w-full px-4 py-5 text-gray-900 bg-transparent focus:outline-none text-[15px]"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-400 hover:text-gray-700">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Live Results */}
              {searchQuery.length > 1 && (
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {searchResults.length === 0 ? (
                    <p className="p-6 text-center text-gray-400 text-sm">No products found for "<span className="text-gray-700 font-medium">{searchQuery}</span>"</p>
                  ) : (
                    searchResults.map(p => (
                      <Link key={p.id} href={`/product/${p.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{p.title}</h4>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{p.category} · PKR {Number(p.price).toLocaleString()}</p>
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
              <nav className="p-6 space-y-1 flex-1">
                <button onClick={() => { setMenu(false); setSearchOpen(true); }} className="flex items-center gap-3 py-3 text-[15px] font-medium text-gray-800 border-b border-gray-50 hover:text-rose-600 transition-colors w-full text-left">
                  <Search size={16} strokeWidth={1.5} /> Search
                </button>
                {[{ label: "Home", href: "#home" }, { label: "New In", href: "#featured" }, { label: "About", href: "#about" }].map(({ label, href }) => (
                  <a key={label} href={href} onClick={() => setMenu(false)} className="block py-3 text-[15px] font-medium text-gray-800 border-b border-gray-50 hover:text-rose-600 transition-colors">{label}</a>
                ))}
                <div className="pt-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">Collections</p>
                  {displayCats.map((c) => (
                    <Link key={c.id} href={`/category/${c.name}`} onClick={() => setMenu(false)} className="flex items-center gap-3 py-2.5 text-[14px] font-medium text-gray-700 hover:text-rose-600 transition-colors">
                      <span>{c.icon}</span> {c.name}
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="p-5 border-t border-gray-100">
                <a href={`https://wa.me/${WA}`} target="_blank" className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <MessageCircle size={16} /> WhatsApp Support
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ CART SIDEBAR ━━━ */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex justify-end" onClick={() => setCartOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.32 }}
              className="relative w-full max-w-[420px] bg-white h-full flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h3 className="font-display text-2xl font-medium text-gray-900 tracking-wide">Your Bag</h3>
                  <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full pb-20 text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <ShoppingCart className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-gray-500 text-sm">Your bag is empty</p>
                    <button onClick={() => setCartOpen(false)} className="mt-4 text-[12px] tracking-widest uppercase font-medium text-gray-900 underline underline-offset-4">Continue Shopping</button>
                  </div>
                ) : (
                  <div className="px-6 py-4 space-y-5">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex gap-4">
                        <div className="w-[80px] h-[100px] rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="text-[13.5px] font-medium text-gray-900 leading-snug truncate">{item.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">Size: {item.size}</p>
                          <p className="text-[13px] font-semibold text-gray-900 mt-1.5">PKR {item.price.toLocaleString()}</p>
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                              <button onClick={() => updateQty(item.id, item.size, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">−</button>
                              <span className="w-7 text-center text-[12px] font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.size, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id, item.size)} className="text-gray-300 hover:text-red-400 transition-colors ml-auto">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-5 space-y-3 bg-gray-50/50">
                  <h4 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-3">Delivery Details</h4>
                  {[
                    { key: "name", placeholder: "Full Name" },
                    { key: "phone", placeholder: "WhatsApp Number" },
                    { key: "city", placeholder: "City" },
                    { key: "address", placeholder: "Complete Address" },
                  ].map(({ key, placeholder }) => (
                    <input key={key} type="text" placeholder={placeholder} value={(checkout as any)[key]}
                      onChange={(e) => setCheckout({ ...checkout, [key]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {["COD", "Bank Transfer"].map((method) => (
                      <button key={method} onClick={() => setCheckout({ ...checkout, payment: method })}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-medium border transition-all ${checkout.payment === method ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                        {method === "COD" ? <Banknote size={13} /> : <Building size={13} />}
                        {method}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 pb-1">
                    <span className="text-[13px] text-gray-500">Total</span>
                    <span className="font-display text-2xl font-medium text-gray-900">PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <button onClick={handlePlaceOrder}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-gray-800 text-white font-medium py-3.5 rounded-xl text-[13px] tracking-wider uppercase transition-colors">
                    <MessageCircle size={15} strokeWidth={1.5} /> Order via WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <a href="#featured"
                className="group inline-flex items-center gap-2.5 bg-white text-gray-900 font-medium px-7 py-3.5 rounded-full text-[12.5px] tracking-wider uppercase hover:bg-rose-50 transition-colors shadow-xl shadow-black/20">
                Shop Now
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#categories"
                className="inline-flex items-center gap-2.5 border border-white/25 text-white font-medium px-7 py-3.5 rounded-full text-[12.5px] tracking-wider uppercase hover:bg-white/10 transition-colors backdrop-blur-sm">
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
                    <img src={p.image} alt={p.title} className="product-img-main w-full h-full object-cover transition-transform duration-700" />
                    {p.image2 && (
                      <img src={p.image2} alt="" className="product-img-alt absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500" />
                    )}

                    <button
                      onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm">
                      <Heart size={14} strokeWidth={1.5} className={wishlist.includes(p.id) ? "fill-rose-500 stroke-rose-500" : "stroke-gray-600"} />
                    </button>

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {p.inStock === false && (
                        <span className="bg-[#1a1a1a] text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm">Sold Out</span>
                      )}
                    </div>

                    <div className="product-overlay absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300">
                      <button disabled={p.inStock === false}
                        onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
                        className="w-full bg-white/95 backdrop-blur-sm text-gray-900 py-2.5 text-[10.5px] font-semibold tracking-[0.12em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm">
                        {p.inStock === false ? "Sold Out" : "Add to Bag"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <Link href={`/product/${p.id}`}>
                      <h4 className="text-[13px] font-medium text-gray-800 leading-snug hover:text-rose-600 transition-colors line-clamp-2">{p.title}</h4>
                    </Link>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[13.5px] font-semibold text-gray-900">PKR {Number(p.price).toLocaleString()}</span>
                    </div>
                    {p.sizes?.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1 tracking-wide">{p.sizes.join(" · ")}</p>
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
            <Link href="/category/Silk"
              className="inline-flex items-center gap-2 mt-6 text-[11.5px] tracking-[0.18em] uppercase font-medium text-white border-b border-white/40 pb-0.5 hover:border-rose-400 hover:text-rose-300 transition-colors">
              Explore Now <ArrowRight size={12} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━ CATEGORIES ━━━ */}
      <section id="categories" className="py-16 md:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-rose-500">Explore</span>
            <h2 className="font-display text-3xl md:text-5xl font-light text-gray-900 mt-2">Shop by <em>Category</em></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {displayCats.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <Link href={`/category/${c.name}`} className="group block relative overflow-hidden rounded-xl aspect-square shadow-sm">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/75 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="text-2xl block mb-1.5">{c.icon}</span>
                    <h4 className="font-display text-xl font-medium text-white capitalize group-hover:text-rose-300 transition-colors">{c.name}</h4>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-white/50 mt-0.5 flex items-center gap-1">
                      Shop Now <ArrowRight size={9} />
                    </p>
                  </div>
                </Link>
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

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-[#0f0f0f] text-gray-500 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/5">
            <div>
              <img src={LOGO_URL} alt="MultiBrand" className="h-8 invert mb-4" />
              <p className="text-[12.5px] leading-relaxed text-gray-600 max-w-xs">
                Premium Pakistani fashion delivered to your doorstep with love.
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-600 mb-4 font-medium">Collections</p>
              <div className="space-y-2.5">
                {displayCats.map((c) => (
                  <Link key={c.id} href={`/category/${c.name}`} className="block text-[13px] text-gray-500 hover:text-white transition-colors capitalize">{c.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-600 mb-4 font-medium">Quick Links</p>
              <div className="space-y-2.5">
                {[{ l: "Home", h: "#home" }, { l: "New Arrivals", h: "#featured" }, { l: "About", h: "#about" }].map(({ l, h }) => (
                  <a key={l} href={h} className="block text-[13px] text-gray-500 hover:text-white transition-colors">{l}</a>
                ))}
                <Link href="/admin" className="block text-[13px] text-gray-600 hover:text-white transition-colors">Admin Panel</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
            <p className="text-[11px] text-gray-700">© 2025 MultiBrand. All Rights Reserved.</p>
            <a href={`https://wa.me/${WA}`} target="_blank" className="flex items-center gap-2 text-[11px] text-green-600/70 hover:text-green-500 transition-colors">
              <MessageCircle size={13} strokeWidth={1.5} /> WhatsApp Us
            </a>
          </div>
        </div>
      </footer>

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
                  <button onClick={saveLead}
                    className="w-full bg-[#1a1a1a] hover:bg-rose-700 text-white font-medium py-3 rounded-xl text-[12.5px] tracking-wider uppercase transition-colors">
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
      <motion.a href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}`} target="_blank" aria-label="WhatsApp"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2, type: "spring" }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30 hover:scale-110 transition-transform"
        style={{ width: 52, height: 52 }}>
        <MessageCircle size={24} strokeWidth={1.5} />
      </motion.a>
    </>
  );
}