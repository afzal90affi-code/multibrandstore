// ============================================================
// FILE: components/Footer.tsx
// NAYA FILE BANAO
// PURANA PURA CODE REPLACE KARO
// ============================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { client } from "../lib/sanity";
import { SITE_NAME, slugify } from "../lib/site";

const WA_NUM = "923333010842";

const CATS_Q = '*[_type == "category"] | order(name asc){ _id, name }';

const FT_CSS = "" +
  ".ft{background:#171310;color:#efe7dc}" +
  ".ft a{text-decoration:none}" +
  ".ftwrap{max-width:1200px;margin:0 auto;padding:52px 20px 0}" +
  ".ftgrid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:40px;padding-bottom:44px}" +
  ".fth{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9b8a3;margin-bottom:14px;font-weight:700}" +
  ".ftlink{display:block;font-size:13.5px;color:#cfc4b5;margin-bottom:9px;transition:color .2s}" +
  ".ftlink:hover{color:#fff}" +
  ".ftabout{font-size:13.5px;line-height:1.75;color:#b8ac9d;max-width:320px;margin:0 0 16px}" +
  ".ftpay{display:inline-block;border:1px solid #3a332b;border-radius:4px;padding:6px 12px;font-size:11px;letter-spacing:1px;color:#cfc4b5;margin:0 6px 6px 0}" +
  ".ftwa{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff;font-size:13px;font-weight:600;padding:11px 16px;border-radius:6px;margin-top:8px}" +
  ".ftnum{font-size:14px;font-weight:600;color:#fff}" +
  ".ftbottom{border-top:1px solid #2a241d;padding:18px 20px 86px;text-align:center;font-size:12px;color:#8f8577}" +
  "@media(max-width:860px){.ftgrid{grid-template-columns:1fr 1fr}}" +
  "@media(max-width:500px){.ftgrid{grid-template-columns:1fr;gap:30px}}";

export default function Footer() {
  const [cats, setCats] = useState<any[]>([]);

  useEffect(() => {
    client.fetch(CATS_Q)
      .then((d: any) => setCats(d || []))
      .catch(() => setCats([]));
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="ft">
      <style>{FT_CSS}</style>

      <div className="ftwrap">
        <div className="ftgrid">

          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, marginBottom: 12 }}>
              {SITE_NAME}
            </div>
            <p className="ftabout">
              Multi-brand women&apos;s fashion from Pakistan&apos;s trusted brands — kurtis,
              2 &amp; 3 piece suits, lawn and formal wear. Nationwide delivery with
              Cash on Delivery.
            </p>
            <div>
              <span className="ftpay">Cash on Delivery</span>
              <span className="ftpay">Bank Transfer</span>
            </div>
          </div>

          <div>
            <div className="fth">Shop</div>
            <Link className="ftlink" href="/">Home</Link>
            {cats.map((c: any) => (
              <Link key={c._id} className="ftlink" href={"/category/" + slugify(c.name || "")}>
                {c.name}
              </Link>
            ))}
          </div>

          <div>
            <div className="fth">Get in Touch</div>
            <div className="ftnum">{"+92 333 3010842"}</div>
            <a
              className="ftwa"
              href={"https://wa.me/" + WA_NUM + "?text=" + encodeURIComponent("Hi! I want to place an order.")}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} />
              Order on WhatsApp
            </a>
            <p className="ftabout" style={{ marginTop: 14 }}>
              Order, exchange ya kisi bhi sawal ke liye WhatsApp par rabta karein —
              hum jaldi reply karte hain.
            </p>
          </div>

        </div>
      </div>

      <div className="ftbottom">
        {"© " + year + " " + SITE_NAME + ". All rights reserved."}
      </div>
    </footer>
  );
}