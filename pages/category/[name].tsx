// FILE: pages/category/[name].tsx  (PURANA PURA CODE REPLACE KARO)
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { sanityFetch, imgURL, type Product } from "../../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../../lib/site";

interface CategoryInfo { _id: string; name: string; description?: string | null; }
interface SubInfo { _id: string; name: string; }
type CardProduct = Product & { brand?: string | null };

const ALL_CATS = `*[_type == "category"]{ _id, name, description }`;
const CAT_PRODUCTS = `*[_type == "product" && (category->name == $name || subCategory->parentCategory->name == $name)] | order(_createdAt desc){
  _id, title, price, oldPrice, brand, inStock,
  "imgRef": image.asset->_ref,
  "sub": subCategory->name
}`;
const CAT_SUBS = `*[_type == "subCategory" && parentCategory->name == $catName]{ _id, name }`;

export default function CategoryPage({ category, subs, products }: { category: CategoryInfo; subs: SubInfo[]; products: CardProduct[] }) {
  const title = `${category.name} Collection | ${SITE_NAME}`;

  // ✅ Admin ne SEO description likhi to wahi use hogi — warna automatic fallback
  const fallbackDesc = `${SITE_NAME} par ${category.name} ki latest collection – ${products.length} products, best prices, all Pakistan delivery. Original branded suits online order karein.`;
  const desc = category.description && category.description.trim() ? category.description.trim().slice(0, 158) : fallbackDesc;
  const seoText = (category.description || "").trim();

  const canonical = `${SITE_URL}/category/${slugify(category.name)}`;
  const ogImg = products[0]?.imgRef ? imgURL(products[0].imgRef, 1200) : `${SITE_URL}/logo.png`;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: canonical,
    description: desc,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.slice(0, 25).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.title,
        url: `${SITE_URL}/product/${p._id}`,
      })),
    },
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: category.name, item: canonical },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      </Head>

      {/* AGAR HEADER HAR PAGE PE ALAG LAGTA HAI TO YAHAN <Header /> PASTE KARO */}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link> / {category.name}
        </nav>
        <h1 style={{ fontSize: 28, textTransform: "capitalize", margin: "8px 0" }}>
          {category.name} Collection
        </h1>
        <p style={{ color: "#666", margin: 0 }}>{products.length} Products</p>

        {subs.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
            {subs.map((s) => (
              <Link
                key={s._id}
                href={`/category/${slugify(category.name)}/${slugify(s.name)}`}
                style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 20, fontSize: 14, textDecoration: "none", color: "#333" }}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginTop: 20 }}>
          {products.map((p) => (
            <Link key={p._id} href={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <img
                  src={imgURL(p.imgRef, 600)}
                  alt={`${p.title}${p.brand ? ` – ${p.brand}` : ""} – ${p.sub || category.name} – ${SITE_NAME}`}
                  width={600}
                  height={750}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div style={{ padding: 12 }}>
                  {/* ✅ NAYA: Brand naam card pe */}
                  {p.brand ? (
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#c2185b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {p.brand}
                    </p>
                  ) : null}
                  <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{p.title}</h3>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    PKR {Number(p.price).toLocaleString("en-PK")}
                    {p.oldPrice ? (
                      <del style={{ color: "#999", fontWeight: 400, marginLeft: 8 }}>
                        PKR {Number(p.oldPrice).toLocaleString("en-PK")}
                      </del>
                    ) : null}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ✅ UPDATED: Admin likhi description, warna fallback */}
        <section style={{ marginTop: 40, maxWidth: 800, color: "#444", lineHeight: 1.7 }}>
          <h2 style={{ fontSize: 20 }}>{category.name} – Buy Online in Pakistan</h2>
          {seoText ? (
            <p style={{ whiteSpace: "pre-line", margin: "8px 0 0" }}>{seoText}</p>
          ) : (
            <p>
              {category.name} ki original branded collection {SITE_NAME} par available hai.
              {subs.length > 0 ? ` Sub categories: ${subs.map((s) => s.name).join(", ")}.` : ""}
              {" "}Sab products par all Pakistan delivery, easy ordering aur best prices.
            </p>
          )}
        </section>
      </main>

      {/* AGAR FOOTER ALAG LAGTA HAI TO YAHAN <Footer /> PASTE KARO */}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const cats = await sanityFetch<CategoryInfo[]>(ALL_CATS);
  return {
    paths: cats.map((c) => ({ params: { name: slugify(c.name) } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<{ category: CategoryInfo; subs: SubInfo[]; products: CardProduct[] }> = async ({ params }) => {
  const name = (params?.name as string) || "";
  const cats = await sanityFetch<CategoryInfo[]>(ALL_CATS);
  const category = cats.find((c) => slugify(c.name) === name);
  if (!category) return { notFound: true }; // fake URLs → 404 (soft-404 khatam)

  const [products, subs] = await Promise.all([
    sanityFetch<CardProduct[]>(CAT_PRODUCTS, { name: category.name }),
    sanityFetch<SubInfo[]>(CAT_SUBS, { catName: category.name }),
  ]);
  return { props: { category, subs, products }, revalidate: 300 };
};