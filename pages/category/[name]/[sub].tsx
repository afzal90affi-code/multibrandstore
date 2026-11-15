// pages/category/[name]/[sub].tsx — PURANA PURA CODE REPLACE KARO
// Badlav: 1) Local Navbar hata diya (navbar ab _app.tsx se sab pages pe apne aap aata hai — double navbar khatam)
// 2) Cards ab homepage jaise: hover image swap + wishlist + Sold Out badge + Add to Bag overlay + sizes line
// 3) Price ab navbar ke currency selector pe PKR/USD switch hoti hai (useCurrency + fmt)

import { useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { sanityFetch, imgURL } from "../../../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../../../lib/site";
import { useCart, useCurrency } from "../../_app";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

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

export default function SubCategoryPage({ category, sub, products }: { category: CategoryInfo; sub: SubInfo; products: SubProduct[] }) {
  const { addToCart } = useCart();
  const { fmt } = useCurrency();
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddToCart = (p: SubProduct) => {
    addToCart({ id: p._id, title: p.title, price: Number(p.price), image: imgURL(p.imgRef, 600), size: p.sizes?.[0] || "Free Size", quantity: 1 });
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

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link> / <Link href={"/category/" + slugify(category.name)}>{category.name}</Link> / {sub.name}
        </nav>
        <h1 style={{ fontSize: 26, margin: "8px 0" }}>{sub.name} – {category.name}</h1>
        <p style={{ color: "#666" }}>{products.length} Products</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6" style={{ marginTop: 20 }}>
          {products.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
              className="product-card group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#F6F4F2] rounded-sm">
                <img
                  src={imgURL(p.imgRef, 600)}
                  alt={p.title + " – " + sub.name + " – " + SITE_NAME}
                  className="product-img-main w-full h-full object-cover transition-transform duration-700"
                />
                {p.img2Ref && (
                  <img src={imgURL(p.img2Ref, 600)} alt="" className="product-img-alt absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500" />
                )}

                <button onClick={() => toggleWishlist(p._id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm">
                  <Heart size={14} strokeWidth={1.5} className={wishlist.includes(p._id) ? "fill-rose-500 stroke-rose-500" : "stroke-gray-600"} />
                </button>

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {p.inStock === false && (
                    <span className="bg-[#1a1a1a] text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm">Sold Out</span>
                  )}
                </div>

                <div className="product-overlay absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300">
                  <button disabled={p.inStock === false}
                    onClick={() => handleAddToCart(p)}
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
      </main>
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
  const cats = await sanityFetch<CategoryInfo[]>(ALL_CATS);
  const category = cats.find((c) => slugify(c.name) === (params?.name as string));
  if (!category) return { notFound: true };

  const subs = await sanityFetch<SubInfo[]>(SUBS_OF_CAT, { catName: category.name });
  const sub = subs.find((s) => slugify(s.name) === (params?.sub as string));
  if (!sub) return { notFound: true };

  const products = await sanityFetch<SubProduct[]>(SUB_PRODUCTS, { subId: sub._id });
  return { props: { category, sub, products }, revalidate: 300 };
};