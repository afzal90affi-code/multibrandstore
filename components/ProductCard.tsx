// components/ProductCard.tsx
// PURANA PURA CODE REPLACE KARO
//
// NAYA: IMAGE KE UPAR SHARE BUTTON (neeche right side, safed gol button):
//   - Mobile pe native share sheet khulta hai (WhatsApp, Messages, Copy link...
//     sab isi list me aate hain)
//   - Desktop pe link clipboard me copy hota hai — button 1.5 sec ke liye
//     green ho jata hai aur "Link Copied!" chip dikhta hai
//   - Share pe click karne se product page NAHI khulta (stopPropagation +
//     preventDefault) — sirf share hota hai, card ka Link waise hi chalta hai
//   - Share URL: <site>/product/<_id> — share sheet me product ka title bhi
//     jata hai, WhatsApp me paste karne pe link ke saath preview bhi aata hai
//
// BAQI SAB SAME: hover pe doosri image, -% discount badge, OUT OF STOCK badge,
// brand/title/price row, fmt() se PKR/USD price — sab waise hi.

import { useState } from "react";
import Link from "next/link";
import { Share2, Check } from "lucide-react";
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
  ".pcard{display:block;color:#1a1a1a;text-decoration:none;cursor:pointer}" +
  ".pcimgbox{position:relative;overflow:hidden;background:#f6f2ee;aspect-ratio:3/4}" +
  ".pcimg{width:100%;height:100%;object-fit:cover;display:block}" +
  ".pcimg1{transition:transform .6s ease}" +
  ".pcimg2{position:absolute;top:0;left:0;opacity:0;transition:opacity .35s ease}" +
  ".pcard:hover .pcimg2{opacity:1}" +
  ".pcard:hover .pcimg1{transform:scale(1.05)}" +
  ".pcoff{position:absolute;top:10px;left:10px;background:#111;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;z-index:2}" +
  ".pcsold{position:absolute;top:10px;right:10px;background:#b91c1c;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;z-index:2}" +
  // ━━━ NAYA: share button + copied chip ━━━
  ".pcshare{position:absolute;bottom:10px;right:10px;width:34px;height:34px;border-radius:999px;background:#fff;border:1px solid #e2e2e2;color:#111;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:transform .2s ease,background .2s ease,color .2s ease,border-color .2s ease}" +
  ".pcshare:hover{background:#111;color:#fff;transform:scale(1.1)}" +
  ".pcshare:active{transform:scale(.92)}" +
  ".pcshare.pcdone{background:#16a34a;border-color:#16a34a;color:#fff}" +
  ".pccopied{position:absolute;bottom:14px;right:52px;background:#111;color:#fff;font-size:10px;font-weight:600;padding:3px 9px;border-radius:999px;z-index:3;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}" +
  ".pcinfo{padding:10px 2px 6px}" +
  ".pcbrand{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8a8a8a;margin-bottom:3px}" +
  ".pctitle{font-size:14px;font-weight:600;line-height:1.35;color:#222;margin-bottom:6px}" +
  ".pcprice{display:flex;align-items:baseline;gap:8px}" +
  ".pcnow{font-size:15px;font-weight:700;color:#111}" +
  ".pcold{font-size:13px;color:#999;text-decoration:line-through}";

export default function ProductCard({ p }: { p: CardProduct }) {
  const { fmt } = useCurrency();
  const [copied, setCopied] = useState(false);

  const url1 = cdnUrl(p.imgRef);
  const url2 = cdnUrl(p.img2Ref);
  const off =
    p.price && p.oldPrice && p.oldPrice > p.price
      ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
      : 0;
  const soldOut = p.inStock === false;

  // ━━━ SHARE HANDLER ━━━
  // e.preventDefault() + e.stopPropagation() zaroori hain — warna card ka
  // <Link> chal par jayega aur share ke bajaye product page khul jayega.
  // Pehle native share (mobile: WhatsApp bhi list me hota hai), warna
  // clipboard copy (desktop), aur clipboard block ho to purana fallback.
  const handleShare = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p._id) return;
    const url = window.location.origin + "/product/" + p._id;

    // STEP 1 - Native share sheet (mobile) — user cancel kare to chup rehna hai
    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share({ title: p.title || "MultiBrand", url });
        return;
      } catch (err: any) {
        if (err && err.name === "AbortError") return;
        // share fail hua — neechy clipboard pe gir jao
      }
    }

    // STEP 2 - Clipboard copy (desktop / https)
    const showCopied = function () {
      setCopied(true);
      window.setTimeout(function () {
        setCopied(false);
      }, 1500);
    };
    try {
      await navigator.clipboard.writeText(url);
      showCopied();
      return;
    } catch {}

    // STEP 3 - Purana fallback (clipboard API block ho to)
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopied();
    } catch {}
  };

  const cardBody = (
    <>
      <div className="pcimgbox">
        {url1 ? (
          <img className="pcimg pcimg1" src={url1} alt={p.title} loading="lazy" />
        ) : null}
        {url2 ? (
          <img className="pcimg pcimg2" src={url2} alt={p.title} loading="lazy" />
        ) : null}
        {off > 0 ? <span className="pcoff">-{off}%</span> : null}
        {soldOut ? <span className="pcsold">OUT OF STOCK</span> : null}
        {/* ━━━ NAYA: SHARE BUTTON (sirf jab _id ho, tabhi share ka URL ban sakta hai) ━━━ */}
        {p._id ? (
          <button
            type="button"
            className={"pcshare" + (copied ? " pcdone" : "")}
            aria-label="Share product"
            title="Share"
            onClick={handleShare}
          >
            {copied ? <Check size={15} strokeWidth={2.5} /> : <Share2 size={15} />}
          </button>
        ) : null}
        {copied ? <span className="pccopied">Link Copied!</span> : null}
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
    </>
  );

  // Pura card clickable: image, title, price — kahin bhi click karo,
  // /product/<id> wala product page khul jayega (share button ke ilawa —
  // wo share karta hai, navigate nahi karta)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      {p._id ? (
        <Link href={"/product/" + p._id} className="pcard">
          {cardBody}
        </Link>
      ) : (
        <div className="pcard">{cardBody}</div>
      )}
    </>
  );
}