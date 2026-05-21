"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { ArrowLeft, ShoppingCart, CheckCircle, XCircle, Search, Heart, MessageCircle } from "lucide-react";
import { useCart } from "../_app";

const WA = "923222806245"; // ⚠️ APNA WHATSAPP NUMBER
const LOGO_URL = "/logo.png";
const SITE_URL = "https://yourdomain.com"; // ⚠️ APNI DOMAIN LINK YAHAN LAGAYEN

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const { addToCart, totalItems } = useCart();
  
  // ✅ Image Gallery State
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!product) return;
    const sizes = Array.isArray(product.sizes)
      ? product.sizes
      : product.sizes
      ? String(product.sizes).split(",").map((size) => size.trim()).filter(Boolean)
      : [];
    setSizeOptions(sizes);
    setSelectedSizes([]);
  }, [product]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) { setError("Product ID missing."); setLoading(false); return; }

    const productId = String(id);

    async function loadProduct() {
      try {
        const snapshot = await getDoc(doc(db, "products", productId));
        if (!snapshot.exists()) { 
          setError("Product not found."); 
        } else { 
          const data = { id: snapshot.id, ...snapshot.data() } as any;
          setProduct(data);
          setActiveImage(0); // Reset image on new product load
          
          if (data.category) {
            const categoryStr = String(data.category);
            const q = query(collection(db, "products"), where("category", "==", categoryStr), limit(5));
            const recSnap = await getDocs(q);
            const recs = recSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((p: any) => p.id !== data.id).slice(0, 4);
            setRecommended(recs);
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

  // ✅ Array of images (Filters out empty ones)
  const images = product ? [product.image, product.image2].filter(Boolean) : [];

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": images,
    "description": product.description || `Buy ${product.title} online at MultiBrand.`,
    "sku": product.id,
    "brand": { "@type": "Brand", "name": "MultiBrand" },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/product/${product.id}`,
      "priceCurrency": "PKR",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <>
      {product && (
        <Head>
          <title>{product.title} | MultiBrand - Premium Pakistani Suits</title>
          <meta name="description" content={product.description || `Buy ${product.title} for PKR ${product.price}. Premium quality Pakistani dresses with Cash on Delivery.`} />
          <meta name="keywords" content={`${product.title}, ${product.category}, Pakistani suits, Lawn dresses, MultiBrand`} />
          <link rel="canonical" href={`${SITE_URL}/product/${product.id}`} />
          <meta property="og:type" content="product" />
          <meta property="og:title" content={`${product.title} | MultiBrand`} />
          <meta property="og:description" content={`PKR ${product.price}. ${product.description || 'Premium Pakistani Dress.'}`} />
          <meta property="og:image" content={product.image} />
          <meta property="og:url" content={`${SITE_URL}/product/${product.id}`} />
          <meta property="product:price:amount" content={product.price} />
          <meta property="product:price:currency" content="PKR" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={product.title} />
          <meta name="twitter:description" content={`PKR ${product.price}. Buy now at MultiBrand.`} />
          <meta name="twitter:image" content={product.image} />
        </Head>
      )}

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="MultiBrand Home"><img src={LOGO_URL} alt="MultiBrand Logo" className="h-34 w-auto" /></Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Home</Link>
              <a href="/#featured" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Products</a>
              <a href="/#categories" className="text-[13px] font-semibold text-gray-700 hover:text-rose-600 uppercase tracking-wider">Categories</a>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600" aria-label="Search"><Search size={20} /></button>
            <button className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-700 hover:text-rose-600" aria-label="Wishlist"><Heart size={20} /></button>
            <Link href="/" className="relative w-9 h-9 flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors" aria-label="Cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>)}
            </Link>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 font-semibold">
                <ArrowLeft size={18} /> Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{product?.title || "Product Details"}</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm">
              <ShoppingCart size={16} /> {product ? (product.inStock ? "In Stock" : "Out of Stock") : "Loading..."}
            </span>
          </div>

          <article className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* ✅ IMAGE GALLERY SECTION */}
            <div className="space-y-3">
              {/* Main Large Image */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                <img
                  src={images[activeImage] || "/"}
                  alt={product?.title || "Product image"}
                  className="w-full h-full object-cover object-center transition-opacity duration-300"
                  loading="lazy"
                />
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${product?.inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  {product?.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Thumbnail Selection */}
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx
                          ? "border-rose-600 shadow-md scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product?.title} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                {loading ? (
                  <div className="text-center text-gray-500 py-12">Loading product details...</div>
                ) : error ? (
                  <div className="space-y-4 text-center py-12 text-red-600">
                    <XCircle size={32} className="mx-auto" />
                    <p className="text-lg font-semibold">{error}</p>
                    <p className="text-sm text-gray-500">Check the product link or add the product from admin.</p>
                  </div>
                ) : product ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm uppercase tracking-[0.3em] text-rose-500 font-bold">{product.category || "Uncategorized"}</p>
                      <p className="text-2xl font-extrabold text-gray-900">PKR {Number(product.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="mt-6 space-y-4 text-gray-600">
                      <p>{product.description || "A premium fabric product from MultiBrand. Order now for quick delivery across Pakistan."}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Category</p>
                          <p className="mt-2 font-semibold text-gray-900 capitalize">{product.category || "Lawn"}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Availability</p>
                          <p className="mt-2 font-semibold text-gray-900">{product.inStock ? "In stock" : "Currently unavailable"}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Sizes</p>
                        {(() => {
                          const sizes = Array.isArray(product?.sizes) ? product.sizes : product?.sizes ? String(product.sizes).split(",").map((s) => s.trim()).filter(Boolean) : [];
                          return sizes.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sizes.map((size: string) => (
                                <span key={size} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">{size}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-gray-500">Free Size</p>
                          );
                        })()}
                      </div>
                    </div>
                    {sizeOptions.length > 0 && (
                      <div className="mt-6 rounded-2xl bg-gray-50 p-4 space-y-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Choose Sizes (select multiple)</p>
                        <div className="grid grid-cols-2 gap-3">
                          {sizeOptions.map((size) => (
                            <label key={size} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${selectedSizes.includes(size) ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"}`}>
                              <input
                                type="checkbox"
                                name="product-size"
                                checked={selectedSizes.includes(size)}
                                onChange={() => {
                                  setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
                                }}
                                className="h-4 w-4 accent-rose-600"
                              />
                              <span className="text-sm font-semibold">{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        disabled={!product?.inStock}
                        onClick={() => {
                          if (!product) return;
                          const sizesToAdd = selectedSizes.length > 0 ? selectedSizes : ["Free Size"];
                          sizesToAdd.forEach((size) => {
                            addToCart({ id: product.id, title: product.title || "Product", price: Number(product.price || 0), image: product.image || "", size: size, quantity: 1 });
                          });
                          alert(`${product.title || "Product"} cart mein add ho gaya!`);
                        }}
                        className={`w-full rounded-2xl px-5 py-4 text-sm font-bold text-white transition-colors ${product?.inStock ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-400 cursor-not-allowed"}`}
                      >
                        {product?.inStock ? "Add to Cart" : "Out of Stock"}
                      </button>
                      
                      <button 
                        onClick={() => {
                          if(!product) return;
                          const msg = `Hi! I'm interested in: *${product.title}*\nPrice: PKR ${Number(product.price).toLocaleString()}`;
                          window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
                        }}
                        className="w-full rounded-2xl border border-green-600 bg-white px-5 py-4 text-sm font-semibold text-green-700 text-center hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} /> WhatsApp
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={18} className="text-rose-600" />
                  <h2 className="font-semibold">Why buy from MultiBrand?</h2>
                </div>
                <ul className="mt-4 space-y-3 text-gray-600 text-sm">
                  <li>✅ Fast delivery across Pakistan</li>
                  <li>✅ Cash on delivery available</li>
                  <li>✅ Original fabric and premium stitching</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </main>

      {recommended.length > 0 && (
        <section className="py-12 bg-white border-t" aria-label="Recommended Products">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    {p.inStock === false && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-rose-600 transition-colors">{p.title}</h3>
                    <p className="text-sm font-bold text-gray-900 mt-1">PKR {Number(p.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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

      <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe dress ki detail chahiye.")}`} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform" aria-label="Chat on WhatsApp"><MessageCircle size={26} /></a>
    </>
  );
}