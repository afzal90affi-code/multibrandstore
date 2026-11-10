import Head from "next/head";
import { SITE_URL, SITE_NAME, slugify } from "../lib/site";
import { imgURL, type Product } from "../lib/client";

export default function ProductSEO({ product }: { product: Product }) {
  if (!product || !product._id) return null;

  const title = product.title;
  const canonical = `${SITE_URL}/product/${product._id}`;
  const image = product.imgRef
    ? imgURL(product.imgRef, 1200)
    : `${SITE_URL}/logo.png`;
  const desc = (
    product.description ||
    `${title} – ${SITE_NAME} par online order karein. PKR ${Number(product.price).toLocaleString("en-PK")}. Original branded suit, all Pakistan delivery.`
  ).slice(0, 158);
  const pageTitle = `${title} | ${SITE_NAME}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: [image],
    description: desc,
    sku: product._id,
    brand: { "@type": "Brand", name: product.cat || SITE_NAME },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "PKR",
      price: String(product.price),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(product.cat
        ? [{ "@type": "ListItem", position: 2, name: product.cat, item: `${SITE_URL}/category/${slugify(product.cat)}` }]
        : []),
      { "@type": "ListItem", position: product.cat ? 3 : 2, name: title, item: canonical },
    ],
  };

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
    </Head>
  );
}
