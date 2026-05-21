"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Menu, X, MessageCircle, ArrowRight, ShoppingCart, Shield, Truck, Tag, Banknote, Building, Trash2, Search, Heart, ChevronDown } from "lucide-react";
import { useCart } from "./_app";
import { motion, AnimatePresence } from "framer-motion";
import { NEXT_NAV_DEPLOYMENT_ID_HEADER } from "next/dist/lib/constants";

const WA = "923222806245"; // ⚠️ APNA WHATSAPP NUMBER
const LOGO_URL = "/logo.png"; // ✅ Slash add kiya
const SITE_URL = "https://yourdomain.com"; // ⚠️ APNI DOMAIN LINK YAHAN LAGAYEN
const NAV = [ { l: "Home", h: "#home" }, { l: "New In", h: "#featured" }, { l: "Collections", h: "#categories", isDropdown: true }, { l: "About", h: "#about" } ];

const dummyCats = [
  { id: "d1", name: "Lawn", icon: "🌸", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600", active: true },
  { id: "d2", name: "Chiffon", icon: "✨", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600", active: true },
  { id: "d3", name: "Silk", icon: "👗", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600", active: true },
  { id: "d4", name: "Fragrance", icon: "🧴", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600", active: true }, // ✅ Fragrance Added
];

export default function Home() {
  const [prods, setProds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, addToCart, removeFromCart, updateQty, totalItems, totalPrice, placeOrder } = useCart();
  const [showLead, setShowLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", city: "", need: "" });
  const [checkout, setCheckout] = useState({ name: "", phone: "", city: "", address: "", payment: "COD" });

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "products"), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProds(data);
    });
    const unsub2 = onSnapshot(collection(db, "categories"), (s) => setCats(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c: any) => c.active !== false)));
    const timer = setTimeout(() => { if (!localStorage.getItem("fd_lead")) setShowLead(true); }, 10000);
    return () => { unsub1(); unsub2(); clearTimeout(timer); };
  }, []);

  const closeLead = () => { setShowLead(false); localStorage.setItem("fd_lead", "1"); };
  const saveLead = async () => { if (!leadForm.name.trim() || !leadForm.phone.trim()) return; await addDoc(collection(db, "leads"), { ...leadForm, createdAt: serverTimestamp(), source: "popup" }); closeLead(); };
  const featured = prods.filter((p: any) => p.featured).slice(0, 8);
  const displayCats = cats;
  const handleAddToCart = (p: any) => { addToCart({ id: p.id, title: p.title, price: Number(p.price), image: p.image, size: p.sizes?.[0] || "Free Size", quantity: 1 }); };
  const handlePlaceOrder = () => { if (!checkout.name || !checkout.phone || !checkout.city || !checkout.address) { alert("Please fill all details"); return; } placeOrder(checkout, WA); setCartOpen(false); setCheckout({ name: "", phone: "", city: "", address: "", payment: "COD" }); };

  // ✅ SEO JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MultiBrand",
    "url": SITE_URL,
    "description": "Premium Pakistani Ladies Dresses - Lawn, Chiffon, Silk & Fragrance."
  };

  return (
    <>
      {/* ━━━ SEO HEAD ━━━ */}
      <Head>
        <title>MultiBrand | Premium Pakistani Suits & Fragrance</title>
        <meta name="description" content="Shop premium Pakistani Lawn, Chiffon, Silk suits and Fragrances online. Cash on Delivery available across Pakistan." />
        <meta name="keywords" content="Pakistani suits, Lawn dresses, Chiffon, Silk, Fragrance, MultiBrand, COD Pakistan" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content="MultiBrand | Premium Pakistani Suits" />
        <meta property="og:description" content="Elegant Lawn, Luxurious Chiffon & Pure Silk. COD Available." />
        <meta property="og:image" content={LOGO_URL} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button onClick={() => setMenu(true)} className="md:hidden text-gray-800"><Menu size={22} /></button>
          <Link href="/" className="flex items-center gap-2"><img src={LOGO_URL} alt="MultiBrand Logo" className="h-34 w-auto" /></Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Home</a>
            <a href="#featured" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">New In</a>
            
            {/* ✅ COLLECTIONS DROPDOWN */}
            <div className="relative group">
              <button className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1">
                Collections <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-2">
                {displayCats.map((c) => (
                  <Link key={c.id} href={`/category/${c.name}`} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-sm font-medium text-gray-800 capitalize">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <a href="#about" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">About</a>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Search size={20} /></button>
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Heart size={20} /></button>
            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors">
              <ShoppingCart size={20} />{totalItems > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>)}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>{menu && (<motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-0 z-[60] flex" onClick={() => setMenu(false)}><div className="w-72 bg-white h-full shadow-2xl p-6 relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setMenu(false)} className="absolute top-4 right-4"><X size={20} /></button><img src={LOGO_URL} alt="Logo" className="h-10 mb-8" /><div className="space-y-4"><a href="#home" onClick={() => setMenu(false)} className="block text-gray-800 font-semibold text-lg">Home</a><a href="#featured" onClick={() => setMenu(false)} className="block text-gray-800 font-semibold text-lg">New In</a><div><p className="text-gray-400 text-xs uppercase mb-2 font-bold">Collections</p>{displayCats.map(c => (<Link key={c.id} href={`/category/${c.name}`} onClick={() => setMenu(false)} className="flex items-center gap-2 py-2 text-gray-800 font-medium">{c.icon} {c.name}</Link>))}</div></div></div><div className="flex-1 bg-black/40" /></motion.div>)}</AnimatePresence>

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex justify-end" onClick={() => setCartOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10"><h3 className="font-bold text-lg text-gray-900">Shopping Bag ({totalItems})</h3><button onClick={() => setCartOpen(false)} className="text-gray-500"><X size={20} /></button></div>
              {items.length === 0 ? (<div className="p-10 text-center text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Aapka cart khaali hai</p></div>) : (
                <>
                  <div className="p-4 space-y-4">{items.map((item) => (<div key={`${item.id}-${item.size}`} className="flex gap-3 border-b pb-4"><img src={item.image} alt="" className="w-20 h-24 rounded-lg object-cover border" /><div className="flex-1 min-w-0"><h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4><p className="text-xs text-gray-500 mt-0.5">Size: {item.size}</p><p className="text-sm font-bold text-gray-900 mt-1">PKR {item.price.toLocaleString()}</p><div className="flex items-center gap-2 mt-2"><button onClick={() => updateQty(item.id, item.size, item.quantity - 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600">−</button><span className="text-sm font-bold w-4 text-center">{item.quantity}</span><button onClick={() => updateQty(item.id, item.size, item.quantity + 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600">+</button><button onClick={() => removeFromCart(item.id, item.size)} className="ml-auto text-red-500"><Trash2 size={16} /></button></div></div></div>))}</div>
                  <div className="p-4 bg-gray-50 space-y-3">
                    <h4 className="text-sm font-bold text-gray-900">Checkout Details</h4>
                    <input type="text" placeholder="Your Name" value={checkout.name} onChange={(e) => setCheckout({...checkout, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                    <input type="text" placeholder="WhatsApp Number" value={checkout.phone} onChange={(e) => setCheckout({...checkout, phone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                    <input type="text" placeholder="City" value={checkout.city} onChange={(e) => setCheckout({...checkout, city: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                    <input type="text" placeholder="Complete Address" value={checkout.address} onChange={(e) => setCheckout({...checkout, address: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setCheckout({...checkout, payment: "COD"})} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border transition-all ${checkout.payment === "COD" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-gray-300 text-gray-600"}`}><Banknote size={14} /> COD</button>
                      <button onClick={() => setCheckout({...checkout, payment: "Bank Transfer"})} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border transition-all ${checkout.payment === "Bank Transfer" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-gray-300 text-gray-600"}`}><Building size={14} /> Bank Transfer</button>
                    </div>
                  </div>
                  <div className="sticky bottom-0 bg-white border-t p-5 space-y-4"><div className="flex justify-between items-center"><span className="text-gray-600">Subtotal</span><span className="text-xl font-extrabold text-gray-900">PKR {totalPrice.toLocaleString()}</span></div><button onClick={handlePlaceOrder} className="w-full flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold py-4 rounded-lg text-sm transition-colors"><MessageCircle size={18} /> Order via WhatsApp</button></div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ HERO SECTION WITH VIDEO ━━━ */}
      <section id="home" className="relative overflow-hidden bg-black min-h-[85vh] flex items-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-100">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full mb-6 border border-rose-500/20">New Collection 2024</span>
            <h1 className="font-black text-5xl sm:text-6xl md:text-7xl leading-[1.05] text-white mb-6">PREMIUM <br /><span className="text-rose-400">PAKISTANI SUITS</span></h1>
            <p className="text-gray-300 text-lg mb-8 max-w-md">Elegant Lawn, Luxurious Chiffon, Pure Silk & Exclusive Fragrances — Delivered with Cash on Delivery.</p>
            <div className="flex flex-wrap gap-4">
              <a href="#featured" className="inline-flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold px-8 py-4 rounded-xl text-sm transition-colors shadow-2xl shadow-rose-500/20">Shop Now <ArrowRight size={16} /></a>
              <a href="#categories" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-sm border border-white/10 transition-colors">View Categories</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ✅ BEAUTIFUL FEATURED PRODUCTS (Beejays Style) */}
      {featured.length > 0 && (
        <section id="featured" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-rose-600">Handpicked For You</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">NEW ARRIVALS</h2>
              <div className="w-16 h-1 bg-rose-600 mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group">
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      {p.image2 && <img src={p.image2} alt={p.title} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                      {p.inStock === false && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-full tracking-wider">SOLD OUT</span>
                        </div>
                      )}
                      {/* Hover Add to Cart Button */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                        <button disabled={p.inStock === false} onClick={(e) => { e.preventDefault(); handleAddToCart(p); }} className="w-full bg-gray-900 hover:bg-rose-700 text-white py-2.5 text-xs font-bold transition-colors disabled:bg-gray-400">
                          {p.inStock === false ? "Out of Stock" : "ADD TO CART"}
                        </button>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 text-center">
                    <Link href={`/product/${p.id}`}><h4 className="text-sm font-medium text-gray-800 hover:text-rose-600 transition-colors truncate">{p.title}</h4></Link>
                    <p className="text-sm font-bold text-gray-900 mt-1">PKR {Number(p.price).toLocaleString()}</p>
                    {p.sizes && p.sizes.length > 0 && (
                      <div className="flex gap-1 justify-center mt-2">
                        {p.sizes.map((size: string) => (
                          <span key={size} className="px-2 py-0.5 border border-gray-300 text-gray-600 rounded text-[9px] font-semibold">{size}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ✅ CATEGORIES (Including Fragrance) */}
      <section id="categories" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12"><span className="text-[10px] font-bold tracking-[0.3em] uppercase text-rose-600">Browse</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">SHOP BY CATEGORY</h2><div className="w-16 h-1 bg-rose-600 mx-auto mt-4"></div></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {displayCats.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link href={`/category/${c.name}`} className="group block relative overflow-hidden rounded-2xl aspect-square shadow-sm border border-gray-200">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-center"><span className="text-2xl">{c.icon}</span><h4 className="text-lg font-bold text-white mt-1 group-hover:text-rose-400 transition-colors uppercase tracking-wider">{c.name}</h4></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-12 border-y bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center gap-2"><Truck size={28} className="text-rose-600" /><h4 className="font-bold text-gray-900 text-sm">Free Delivery</h4></div>
          <div className="flex flex-col items-center gap-2"><Shield size={28} className="text-rose-600" /><h4 className="font-bold text-gray-900 text-sm">COD Available</h4></div>
          <div className="flex flex-col items-center gap-2"><Tag size={28} className="text-rose-600" /><h4 className="font-bold text-gray-900 text-sm">Original Fabrics</h4></div>
          <div className="flex flex-col items-center gap-2"><MessageCircle size={28} className="text-rose-600" /><h4 className="font-bold text-gray-900 text-sm">24/7 Support</h4></div>
        </div>
      </section>

      {/* ABOUT & FOOTER */}
      <section id="about" className="py-16 md:py-24 bg-white"><div className="max-w-4xl mx-auto px-4 text-center"><h2 className="text-3xl font-bold text-gray-900 mb-4">Pakistan's Trusted <span className="text-rose-600">Fashion Store</span></h2><p className="text-gray-500 leading-relaxed">Premium quality suits — Lawn, Chiffon, Silk & Fragrances. Original products with complete safety and Cash on Delivery facility across Pakistan.</p></div></section>
      
      <footer className="bg-gray-900 text-gray-400 py-12"><div className="max-w-7xl mx-auto px-4 text-center"><h3 className="text-2xl font-black text-white mb-2">MULTI<span className="text-rose-500">BRAND</span></h3><div className="flex justify-center gap-6 mb-6"><a href="#home" className="hover:text-white text-xs uppercase tracking-wider">Home</a><Link href="/admin" className="hover:text-white text-xs uppercase tracking-wider">Admin</Link></div><p className="text-[11px] text-gray-600">© 2025 MultiBrand. All Rights Reserved.</p></div></footer>

      {/* LEAD POPUP */}
      <AnimatePresence>{showLead && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={closeLead}><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}><button onClick={closeLead} className="absolute top-3 right-3 text-gray-400"><X size={18} /></button><div className="text-center mb-5"><span className="text-4xl">👗</span><h3 className="text-xl font-bold text-gray-900 mt-3">Enjoy deal notification</h3></div><div className="space-y-3"><input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Your Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" /><input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="WhatsApp Number" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" /><button onClick={saveLead} className="w-full bg-gray-900 hover:bg-rose-700 text-white font-bold py-3 rounded-lg text-sm transition-colors">Subscribe ➤</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* WA FAB */}
      <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}`} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"><MessageCircle size={26} /></a>
    </>
  );
}NEXT_NAV_DEPLOYMENT_ID_HEADER