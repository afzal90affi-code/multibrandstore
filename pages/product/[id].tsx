"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { client } from "../../lib/sanity"; // ✅ Sanity Client import kiya
import { ArrowLeft, ShoppingCart, CheckCircle, XCircle, Search, Heart, MessageCircle, Menu, X, Trash2, Banknote, Building } from "lucide-react";
import { useCart } from "../_app";
import { motion, AnimatePresence } from "framer-motion";

const WA = "923333010842"; 
const LOGO_URL = "/logo.png";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const { items, addToCart, removeFromCart, updateQty, totalItems, totalPrice, placeOrder } = useCart();
  
  const [activeImage, setActiveImage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [checkout, setCheckout] = useState({ name: "", phone: "", city: "", address: "", payment: "COD" }); 
  const [cats, setCats] = useState<any[]>([]);

  // ✅ Fetch Categories for Mobile Menu (Sanity GROQ)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const query = `*[_type == "category" && active == true] { _id, name, icon, "image": image.asset->url }`;
        const data = await client.fetch(query);
        setCats(data.map((c: any) => ({ ...c, id: c._id })));
      } catch (err) { console.error("Categories fetch error:", err); }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (!product) return;
    const sizes = Array.isArray(product.sizes) ? product.sizes : product.sizes ? String(product.sizes).split(",").map((size) => size.trim()).filter(Boolean) : [];
    setSizeOptions(sizes);
    setSelectedSizes([]);
  }, [product]);

  // ✅ Fetch Single Product & Recommended Products (Sanity GROQ)
  useEffect(() => {
    if (!router.isReady) return;
    if (!id) { setError("Product ID missing."); setLoading(false); return; }

    async function loadProduct() {
      try {
        // 1. Main Product Fetch
        // 🆕 ADDED: highlights, material in query
        const prodQuery = `*[_type == "product" && _id == $productId][0] {
          _id, title, price, description, highlights, material, inStock, sizes,
          "categoryName": category->name,
          "image": image.asset->url,
          "image2": image2.asset->url
        }`;
        const prodData = await client.fetch(prodQuery, { productId: String(id) });

        if (!prodData) { 
          setError("Product not found."); 
        } else { 
          const mappedProd = { ...prodData, id: prodData._id, category: prodData.categoryName };
          setProduct(mappedProd);
          setActiveImage(0);

          // 2. Recommended Products Fetch (Same Category)
          if (mappedProd.category) {
            const recQuery = `*[_type == "product" && category->name == $catName && _id != $currentId][0...4] {
              _id, title, price, inStock,
              "image": image.asset->url
            }`;
            const recData = await client.fetch(recQuery, { catName: mappedProd.category, currentId: mappedProd.id });
            setRecommended(recData.map((p: any) => ({ ...p, id: p._id })));
          }
        }
      } catch (err) { 
        console.error(err); 
        setError("Unable to load product."); 
      } finally { 
        setLoading(false); 
      }
    }
    loadProduct();
  }, [id, router.isReady]);

  const images = product ? [product.image, product.image2].filter(Boolean) : [];

  const getProductLink = () => {
    if (typeof window !== "undefined" && product) {
      return `${window.location.origin}/product/${product.id}`;
    }
    return "";
  };

  const handlePlaceOrder = () => {
    if (!checkout.name || !checkout.phone || !checkout.city || !checkout.address) { alert("Please fill all details"); return; }
    placeOrder(checkout, WA);
    setCartOpen(false);
    setCheckout({ name: "", phone: "", city: "", address: "", payment: "COD" });
    router.push("/"); 
  };

  return (
    <>
      {product && (
        <Head>
          <title>{product.title} | MultiBrand</title>
          <meta name="description" content={`Buy ${product.title} for PKR ${product.price}. Premium quality Pakistani dresses with Cash on Delivery.`} />
        </Head>
      )}

      {/* ━━━ NAVBAR ━━━ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4 z-10">
            <button onClick={() => setMenuOpen(true)} className="md:hidden text-gray-800"><Menu size={24} /></button>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Home</Link>
              <a href="/#featured" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Products</a>
              <a href="/#categories" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Categories</a>
            </div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none flex items-center z-10">
            <Link href="/"><img src={LOGO_URL} alt="Logo" className="h-34 md:h-34 w-auto" /></Link>
          </div>
          <div className="flex items-center gap-3 z-10">
            <button className="hidden md:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Search size={20} /></button>
            <button className="hidden md:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600"><Heart size={20} /></button>
            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors" aria-label="Cart">
              <ShoppingCart size={22} />
              {totalItems > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>)}
            </button>
          </div>
        </div>
      </nav>

      {/* ━━━ MOBILE MENU ━━━ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-0 z-[60] flex" onClick={() => setMenuOpen(false)}>
            <div className="w-72 bg-white h-full shadow-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-gray-800"><X size={24} /></button>
              <img src={LOGO_URL} alt="Logo" className="h-10 mb-8" />
              <div className="space-y-4">
                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-800 font-semibold text-lg"><ArrowLeft size={18} /> Home</Link>
                <a href="/#featured" onClick={() => setMenuOpen(false)} className="block text-gray-800 font-semibold text-lg">New In</a>
                <div><p className="text-gray-400 text-xs uppercase mb-2 font-bold">Collections</p>{cats.map((c: any) => (<Link key={c.id} href={`/category/${c.name}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-2 text-gray-800 font-medium"><span className="text-lg">{c.icon}</span> {c.name}</Link>))}</div>
              </div>
            </div>
            <div className="flex-1 bg-black/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ CART SIDEBAR */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex justify-end" onClick={() => setCartOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10"><h3 className="font-bold text-lg text-gray-900">Shopping Bag ({totalItems})</h3><button onClick={() => setCartOpen(false)} className="text-gray-500"><X size={20} /></button></div>
              {items.length === 0 ? (
                <div className="p-10 text-center text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Aapka cart khaali hai</p></div>
              ) : (
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

      {/* ━━━ MAIN CONTENT ━━━ */}
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 font-semibold"><ArrowLeft size={18} /> Back to Home</Link>
              <h1 className="text-3xl font-bold text-gray-900">{product?.title || "Product Details"}</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm"><ShoppingCart size={16} /> {product ? (product.inStock ? "In Stock" : "Out of Stock") : "Loading..."}</span>
          </div>

          <article className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                <img src={images[activeImage] || "/"} alt={product?.title || "Product image"} className="w-full h-full object-cover object-center transition-opacity duration-300" loading="lazy" />
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${product?.inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{product?.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
              {images.length > 1 && (<div className="flex gap-3">{images.map((img, idx) => (<button key={idx} onClick={() => setActiveImage(idx)} className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? "border-rose-600 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300"}`}><img src={img} alt={`${product?.title} view ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" /></button>))}</div>)}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                {loading ? (<div className="text-center text-gray-500 py-12">Loading product details...</div>) : error ? (<div className="space-y-4 text-center py-12 text-red-600"><XCircle size={32} className="mx-auto" /><p className="text-lg font-semibold">{error}</p></div>) : product ? (
                  <>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm uppercase tracking-[0.3em] text-rose-500 font-bold">{product.category || "Uncategorized"}</p><p className="text-2xl font-extrabold text-gray-900">PKR {Number(product.price || 0).toLocaleString()}</p></div>
                    
                    <div className="mt-6 space-y-4 text-gray-600">
                      <p>{product.description || "A premium fabric product from MultiBrand. Order now for quick delivery across Pakistan."}</p>
                      
                      {/* 🆕 Highlights Section */}
                      {product.highlights && product.highlights.length > 0 && (
                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Highlights</p>
                          <ul className="mt-2 space-y-1.5">
                            {product.highlights.map((h: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-gray-700">
                                <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" /> {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-[0.3em] text-gray-500">Category</p><p className="mt-2 font-semibold text-gray-900 capitalize">{product.category || "Lawn"}</p></div>
                        <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-[0.3em] text-gray-500">Availability</p><p className="mt-2 font-semibold text-gray-900">{product.inStock ? "In stock" : "Currently unavailable"}</p></div>
                        
                        {/* 🆕 Material Section */}
                        {product.material && (
                          <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Material</p>
                            <p className="mt-2 font-semibold text-gray-900">{product.material}</p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-[0.3em] text-gray-500">Sizes</p>{(() => { const sizes = Array.isArray(product?.sizes) ? product.sizes : product?.sizes ? String(product.sizes).split(",").map((s) => s.trim()).filter(Boolean) : []; return sizes.length > 0 ? (<div className="mt-3 flex flex-wrap gap-2">{sizes.map((size: string) => (<span key={size} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">{size}</span>))}</div>) : (<p className="mt-3 text-sm text-gray-500">Free Size</p>); })()}</div>
                    </div>

                    {sizeOptions.length > 0 && (<div className="mt-6 rounded-2xl bg-gray-50 p-4 space-y-3"><p className="text-xs uppercase tracking-[0.3em] text-gray-500">Choose Sizes</p><div className="grid grid-cols-2 gap-3">{sizeOptions.map((size) => (<label key={size} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${selectedSizes.includes(size) ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"}`}><input type="checkbox" name="product-size" checked={selectedSizes.includes(size)} onChange={() => { setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]); }} className="h-4 w-4 accent-rose-600" /><span className="text-sm font-semibold">{size}</span></label>))}</div></div>)}
                    
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button disabled={!product?.inStock} onClick={() => { if (!product) return; const sizesToAdd = selectedSizes.length > 0 ? selectedSizes : ["Free Size"]; sizesToAdd.forEach((size) => { addToCart({ id: product.id, title: product.title || "Product", price: Number(product.price || 0), image: product.image || "", size: size, quantity: 1 }); }); alert(`${product.title || "Product"} cart mein add ho gaya!`); }} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold text-white transition-colors ${product?.inStock ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-400 cursor-not-allowed"}`}>{product?.inStock ? "Add to Cart" : "Out of Stock"}</button>
                      
                      <button onClick={() => { 
                        if(!product) return; 
                        const productLink = getProductLink(); 
                        const msg = `Hi! I'm interested in:\n*${product.title}*\nPrice: PKR ${Number(product.price).toLocaleString()}\n\n🛍️ View Product: ${productLink}`; 
                        window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank"); 
                      }} className="w-full rounded-2xl border border-green-600 bg-white px-5 py-4 text-sm font-semibold text-green-700 text-center hover:bg-green-50 transition-colors flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp</button>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200"><div className="flex items-center gap-3 text-gray-700"><CheckCircle size={18} className="text-rose-600" /><h2 className="font-semibold">Why buy from MultiBrand?</h2></div><ul className="mt-4 space-y-3 text-gray-600 text-sm"><li>✅ Fast delivery across Pakistan</li><li>✅ Cash on delivery available</li><li>✅ Original fabric and premium stitching</li></ul></div>
            </div>
          </article>
        </div>
      </main>

      {recommended.length > 0 && (
        <section className="py-12 bg-white border-t"><div className="max-w-6xl mx-auto px-4 sm:px-6"><h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{recommended.map((p) => (<Link key={p.id} href={`/product/${p.id}`} className="group block"><div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />{p.inStock === false && (<div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10"><span className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">SOLD OUT</span></div>)}</div><div className="mt-3 text-center"><h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-rose-600 transition-colors">{p.title}</h3><p className="text-sm font-bold text-gray-900 mt-1">PKR {Number(p.price).toLocaleString()}</p></div></Link>))}</div></div></section>
      )}

      <footer className="bg-gray-900 text-gray-400 py-12"><div className="max-w-7xl mx-auto px-4 text-center"><h3 className="text-2xl font-black text-white mb-2">MULTI<span className="text-rose-500">BRAND</span></h3><div className="flex justify-center gap-6 mb-6"><a href="/" className="hover:text-white text-xs uppercase tracking-wider">Home</a><Link href="/admin" className="hover:text-white text-xs uppercase tracking-wider">Admin Panel</Link></div><p className="text-[11px] text-gray-600">© 2025 MultiBrand. All Rights Reserved.</p></div></footer>

      <a 
        href={`https://wa.me/${WA}?text=${encodeURIComponent(product ? `Hi! I'm looking at this product:\n*${product.title}*\n🛍️ Link: ${getProductLink()}` : "Salam! Mujhe dress ki detail chahiye.")}`} 
        target="_blank" 
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform" 
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
}