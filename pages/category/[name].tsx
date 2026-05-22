"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ArrowLeft, ShoppingCart, Search, Heart, MessageCircle, Menu, X } from "lucide-react"; // ✅ Menu aur X add kiye
import { useCart } from "../_app";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Mobile menu ke liye

const WA = "923333010842"; // ⚠️ APNA WHATSAPP NUMBER
const LOGO_URL = "/logo.png";
const SITE_URL = "https://yourdomain.com"; // ⚠️ APNI DOMAIN LINK

export default function CategoryPage() {
  const router = useRouter();
  const categoryName = router.query.name as string | undefined;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, totalItems } = useCart();
  
  const [menuOpen, setMenuOpen] = useState(false); // ✅ Mobile Menu State
  const [cats, setCats] = useState<any[]>([]); // ✅ Categories fetch karne ke liye

  // ✅ Fetch Categories for Mobile Menu
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => c.active !== false));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!categoryName) return;
    const categoryKey = categoryName.toLowerCase().trim();

    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const allProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = allProducts.filter((product: any) => {
        return String(product.category || "").toLowerCase().trim() === categoryKey;
      });
      setProducts(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryName]);

  const title = categoryName ? `${categoryName} Collection` : "Category";

  return (
    <>
      <Head>
        <title>{title} | MultiBrand - Premium Pakistani Suits</title>
        <meta name="description" content={`Shop premium ${categoryName} dresses online. Cash on Delivery available across Pakistan.`} />
        <link rel="canonical" href={`${SITE_URL}/category/${categoryName}`} />
      </Head>

      {/* ━━━ NAVBAR (3 Lines - Logo - Basket) ━━━ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          
          {/* Left: 3 Lines (Mobile) / Links (Desktop) */}
          <div className="flex items-center gap-4 z-10">
            <button onClick={() => setMenuOpen(true)} className="md:hidden text-gray-800"><Menu size={24} /></button>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Home</Link>
              <a href="/#featured" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Products</a>
              <a href="/#categories" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Categories</a>
            </div>
          </div>

          {/* Center: Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none flex items-center z-10">
            <Link href="/" aria-label="MultiBrand Home"><img src={LOGO_URL} alt="MultiBrand Logo" className="h-34 md:h-34 w-auto" /></Link>
          </div>

          {/* Right: Basket / Cart */}
          <div className="flex items-center gap-3 z-10">
            <button className="hidden md:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Search size={20} /></button>
            <button className="hidden md:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Heart size={20} /></button>
            <Link href="/" className="relative w-9 h-9 flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors" aria-label="Cart">
              <ShoppingCart size={22} />
              {totalItems > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>)}
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━ MOBILE MENU (3 Lines Dropdown) ━━━ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-0 z-[60] flex" onClick={() => setMenuOpen(false)}>
            <div className="w-72 bg-white h-full shadow-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-gray-800"><X size={24} /></button>
              <img src={LOGO_URL} alt="Logo" className="h-10 mb-8" />
              <div className="space-y-4">
                {/* Home Button inside 3 lines */}
                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
                  <ArrowLeft size={18} /> Home
                </Link>
                <a href="/#featured" onClick={() => setMenuOpen(false)} className="block text-gray-800 font-semibold text-lg">New In</a>
                
                {/* Categories inside 3 lines */}
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-2 font-bold tracking-wider">Collections</p>
                  {cats.map((c: any) => (
                    <Link key={c.id} href={`/category/${c.name}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-2 text-gray-800 font-medium capitalize">
                      <span className="text-lg">{c.icon}</span> {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 bg-black/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ MAIN CONTENT ━━━ */}
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 font-semibold">
              <ArrowLeft size={18} /> Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">{title}</h1>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-20"><div className="w-8 h-8 border-2 border-t-rose-700 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>Loading products...</div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
              <p className="text-lg font-semibold">No products found in this category.</p>
              <p className="text-sm text-gray-500 mt-2">Try another category or add products to the "{categoryName}" category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <div key={p.id} className="group">
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F9F9F9] border border-gray-100">
                      <img 
                        src={p.image || p.image2 || "/"} 
                        alt={p.title || "Product"} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      {p.inStock === false && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">SOLD OUT</span>
                        </div>
                      )}
                      {/* Hover Add to Cart Button */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                        <button 
                          disabled={p.inStock === false} 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            addToCart({ id: p.id, title: p.title, price: Number(p.price), image: p.image, size: p.sizes?.[0] || "Free Size", quantity: 1 }); 
                          }} 
                          className="w-full bg-gray-900 hover:bg-rose-700 text-white py-2.5 text-[11px] font-bold tracking-wider uppercase transition-colors disabled:bg-gray-400"
                        >
                          {p.inStock === false ? "Sold Out" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </Link>
                  {/* Khaadi Style Text */}
                  <div className="mt-3 text-left">
                    <Link href={`/product/${p.id}`}><h4 className="text-[13px] font-medium text-gray-800 truncate hover:text-rose-600 transition-colors">{p.title || "Untitled"}</h4></Link>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">PKR {Number(p.price || 0).toLocaleString()}</p>
                    {p.sizes && p.sizes.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        {p.sizes.map((size: string) => (
                          <span key={size} className="text-[9px] text-gray-500 font-medium">{size}{p.sizes.indexOf(size) < p.sizes.length - 1 ? ' ·' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-black text-white mb-2">MULTI<span className="text-rose-500">BRAND</span></h3>
          <div className="flex justify-center gap-6 mb-6">
            <a href="/" className="hover:text-white text-xs uppercase tracking-wider">Home</a>
            <Link href="/admin" className="hover:text-white text-xs uppercase tracking-wider">Admin Panel</Link>
          </div>
          <p className="text-[11px] text-gray-600">© 2025 MultiBrand. All Rights Reserved.</p>
        </div>
      </footer>

      {/* ━━━ WhatsApp FAB ━━━ */}
      <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}`} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"><MessageCircle size={26} /></a>
    </>
  );
}