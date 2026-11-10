import { useEffect, useState } from "react";
import useUsdRate from "../lib/useUsdRate";

export default function PricePKRUSD({ pkr }: { pkr: number }) {
  const rate = useUsdRate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const usd = Math.round(Number(pkr) / rate);

  return (
    <span style={{ fontWeight: 600 }}>
      PKR {Number(pkr).toLocaleString("en-PK")}
      {mounted ? (
        <span style={{ color: "#888", fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
          (≈ ${usd})
        </span>
      ) : null}
    </span>
  );
}
