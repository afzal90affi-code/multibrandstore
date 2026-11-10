import { useEffect, useState } from "react";
import { USD_PKR_FALLBACK } from "./site";

const CACHE_KEY = "usd_pkr_rate";
const TTL = 12 * 60 * 60 * 1000;

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

  return rate || USD_PKR_FALLBACK;
}