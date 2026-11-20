// lib/useUsdRate.ts
// PURANA PURA CODE REPLACE KARO
//
// KYA BADLA: markup ka DIRECTION theek kiya.
//
//   PURANA: rate × 1.20  (300 => 360) — is se dollar price 20% NEECHE aa jati thi
//           (PKR 18,000 => $50, jabke fair price $60 thi)
//   NAYA:   rate ÷ 1.20  (300 => 250) — ab dollar price 20% UPAR show hoti hai
//           (PKR 18,000 => $72, yani fair $60 + 20%)
//
//   WAJAH: fmt() dollar nikalte waqt price ko rate se DIVIDE karta hai
//   (USD = PKR / rate). Rate barhaoge to dollar CHHOTA hoga, rate
//   chhota karoge to dollar BARHEGA. Is liye 20% upar ke liye rate ko
//   1.20 se divide karna hai, multiply nahi.
//
// KAB KAAM KAREGA: _app.tsx me yeh hook import kar ke fmt() me lagao
// (snippet neechy diya hai), phir navbar ke PKR/USD toggle pe click karo —
// sab prices dollar me 20% above dikhangy. Rate open.er-api.com se aata
// hai, 12 ghante localStorage me cache hota hai, API fail ho to
// USD_PKR_FALLBACK (lib/site.ts) use hota hai.

import { useEffect, useState } from "react";
import { USD_PKR_FALLBACK } from "./site";

const CACHE_KEY = "usd_pkr_rate";
const TTL = 12 * 60 * 60 * 1000; // 12 ghante
const MARKUP = 1.20; // 20% upar: fair $60 => $72 show hoga

export default function useUsdRate(): number {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as {
        r: number; t: number;
      } | null;
      if (c && Date.now() - c.t < TTL && c.r > 0) { setRate(c.r); return; }
    } catch {}

    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d: { rates?: { PKR?: number } }) => {
        const r = d?.rates?.PKR;
        if (r && r > 0) {
          setRate(r);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ r, t: Date.now() }));
        }
      })
      .catch(() => {});
  }, []);

  const base = rate || USD_PKR_FALLBACK;
  // YAHAN FIX: DIVIDE (multiply nahi) — tabhi dollar price 20% UPAR banegi
  return Math.max(1, Math.floor(base / MARKUP));
}