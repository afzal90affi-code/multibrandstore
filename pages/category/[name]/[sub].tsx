import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { sanityFetch, imgURL, type Product } from "../../../lib/client";
import { SITE_URL, SITE_NAME, slugify } from "../../../lib/site";

interface CategoryInfo { _id: string; name: string; }
interface SubInfo { _id: string; name: string; }

const ALL_CATS = `*[_type == "category"]{ _id, name }`;
const SUBS_OF_CAT = `*[_type == "subCategory" && parentCategory->name == $catName]{ _id, name }`;
const SUB_PRODUCTS = `*[_type == "product" && subCategory._ref == $subId] | order(_createdAt desc){
  _id, title, price, oldPrice, inStock,
  "imgRef": image.asset->_ref
}`;

export default function SubCategoryPage({ category, sub, products }: { category: CategoryInfo; sub: SubInfo; products: Product[] }) {
  const title = `${sub.name} – ${category.name} | ${SITE_NAME}`;
  const desc = `${category.name} ke andar ${sub.name} ki collection – ${products.length} products. ${SITE_NAME} par original branded suits best prices par, all Pakistan delivery.`;
  const canonical = `${SITE_URL}/category/${slugify(category.name)}/${slugify(sub.name)}`;
  const ogImg = products[0]?.imgRef ? imgURL(products[0].imgRef, 1200) : `${SITE_URL}/logo.png`;

  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/category/${slugify(category.name)}` },
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
      </Head>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <nav style={{ fontSize: 14, color: "#777", marginBottom: 16 }}>
          <Link href="/">Home</Link> / <Link href={`/category/${slugify(category.name)}`}>{category.name}</Link> / {sub.name}
        </nav>
        <h1 style={{ fontSize: 26, margin: "8px 0" }}>{sub.name} – {category.name}</h1>
        <p style={{ color: "#666" }}>{products.length} Products</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginTop: 20 }}>
          {products.map((p) => (
            <Link key={p._id} href={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <img
                  src={imgURL(p.imgRef, 600)}
                  alt={`${p.title} – ${sub.name} – ${SITE_NAME}`}
                  width={600}
                  height={750}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div style={{ padding: 12 }}>
                  <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{p.title}</h3>
                  <p style={{ margin: 0, fontWeight: 600 }}>PKR {Number(p.price).toLocaleString("en-PK")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const subs = await sanityFetch<{ name: string; parent: string }[]>(
    `*[_type == "subCategory" && defined(parentCategory)]{ name, "parent": parentCategory->name }`
  );
  return {
    paths: subs.map((s) => ({ params: { name: slugify(s.parent), sub: slugify(s.name) } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<{ category: CategoryInfo; sub: SubInfo; products: Product[] }> = async ({ params }) => {
  const cats = await sanityFetch<CategoryInfo[]>(ALL_CATS);
  const category = cats.find((c) => slugify(c.name) === (params?.name as string));
  if (!category) return { notFound: true };

  const subs = await sanityFetch<SubInfo[]>(SUBS_OF_CAT, { catName: category.name });
  const sub = subs.find((s) => slugify(s.name) === (params?.sub as string));
  if (!sub) return { notFound: true };

  const products = await sanityFetch<Product[]>(SUB_PRODUCTS, { subId: sub._id });
  return { props: { category, sub, products }, revalidate: 300 };
};
