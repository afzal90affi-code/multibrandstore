// components/ProductCard.tsx
// PURANA PURA CODE REPLACE KARO

import Link from "next/link";
import { useCurrency } from "../pages/_app";

export type CardProduct = {
  _id: string;
  title: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  imgRef?: string;
  img2Ref?: string;
  inStock?: boolean;
};

const CDN = "https://cdn.sanity.io/images/vieoyox0/production/";

function cdnUrl(ref?: string): string {
  if (!ref) return "";
  let u = ref.replace("image-", "");
  u = u.replace("-jpg", ".jpg").replace("-png", ".png").replace("-webp", ".webp");
  return CDN + u + "?w=700&q=80&auto=format";
}

const CARD_CSS =
  ".pcard{display:block;color:#1a1a1a;text-decoration:none}" +
  ".pcimgbox{position:relative;overflow:hidden;background:#f6f2ee;aspect-ratio:3/4}" +
  ".pcimg{width:100%;height:100%;object-fit:cover;display:block}" +
  ".pcimg1{transition:transform .6s ease}" +
  ".pcimg2{position:absolute;top:0;left:0;opacity:0;transition:opacity .35s ease}" +
  ".pcard:hover .pcimg2{opacity:1}" +
  ".pcard:hover .pcimg1{transform:scale(1.05)}" +
  ".pcoff{position:absolute;top:10px;left:10px;background:#111;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;z-index:2}" +
  ".pcsold{position:absolute;top:10px;right:10px;background:#b91c1c;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;z-index:2}" +
  ".pcinfo{padding:10px 2px 6px}" +
  ".pcbrand{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8a8a8a;margin-bottom:3px}" +
  ".pctitle{font-size:14px;font-weight:600;line-height:1.35;color:#222;margin-bottom:6px}" +
  ".pcprice{display:flex;align-items:baseline;gap:8px}" +
  ".pcnow{font-size:15px;font-weight:700;color:#111}" +
  ".pcold{font-size:13px;color:#999;text-decoration:line-through}";

export default function ProductCard({ p }: { p: CardProduct }) {
  const { fmt } = useCurrency();

  const url1 = cdnUrl(p.imgRef);
  const url2 = cdnUrl(p.img2Ref);
  const off =
    p.price && p.oldPrice && p.oldPrice > p.price
      ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
      : 0;
  const soldOut = p.inStock === false;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      <Link href={"/product/" + p._id} className="pcard">
        <div className="pcimgbox">
          {url1 ? (
            <img className="pcimg pcimg1" src={url1} alt={p.title} loading="lazy" />
          ) : null}
          {url2 ? (
            <img className="pcimg pcimg2" src={url2} alt={p.title} loading="lazy" />
          ) : null}
          {off > 0 ? <span className="pcoff">-{off}%</span> : null}
          {soldOut ? <span className="pcsold">OUT OF STOCK</span> : null}
        </div>
        <div className="pcinfo">
          {p.brand ? <div className="pcbrand">{p.brand}</div> : null}
          <div className="pctitle">{p.title}</div>
          {p.price ? (
            <div className="pcprice">
              <span className="pcnow">{fmt(p.price)}</span>
              {p.oldPrice && p.oldPrice > p.price ? (
                <span className="pcold">{fmt(p.oldPrice)}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </>
  );
}