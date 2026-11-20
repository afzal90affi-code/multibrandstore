// pages/_app.tsx — PURANA PURA CODE REPLACE KARO
// Naya: PKR/USD currency selector (poori site) + Navbar/Footer global (admin pe hidden)
// Naya 2: USD rate ab live useUsdRate hook se aata hai (markup included) — fixed 280 hata diya
//
// IS FILE KI 3 ZAROORI DEPENDENCIES:
//   1) components/Footer.tsx — global footer file (design wahi jo pages me inline tha).
//      Yeh file na ho to import fail hoga.
//   2) lib/site.ts me USD_PKR_FALLBACK export hona chahiye (useUsdRate import karta hai),
//      warna build error: "USD_PKR_FALLBACK" not found.
//   3) lib/useUsdRate.ts me FIXED version laga ho (rate ÷ 1.20 wala) — warna dollar
//      price 20% upar ke bajaye 20% NEECHE dikhegi.
//
// PAGES KA RULE: ab kisi page ke andar <Navbar />, <Footer /> ya inline <footer>
// nahi hona chahiye — dono _app.tsx se globally aate hain (admin pe hidden).

"use client"

import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useUsdRate from '../lib/useUsdRate'

interface CartItem { id: string; title: string; price: number; image: string; size: string; quantity: number; }
interface CartContextType { items: CartItem[]; addToCart: (item: CartItem) => void; removeFromCart: (id: string, size: string) => void; updateQty: (id: string, size: string, quantity: number) => void; clearCart: () => void; totalItems: number; totalPrice: number; placeOrder: (details: any, adminWA: string) => Promise<void>; }

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const qty = item.quantity || 1;
      const exist = prev.find(i => i.id === item.id && i.size === item.size);
      if (exist) {
        return prev.map(i => (i.id === item.id && i.size === item.size) ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }

  const removeFromCart = (id: string, size: string) => { setItems(prev => prev.filter(i => !(i.id === id && i.size === size))); }
  const updateQty = (id: string, size: string, quantity: number) => { if (quantity < 1) return removeFromCart(id, size); setItems(prev => prev.map(i => (i.id === id && i.size === size) ? { ...i, quantity } : i)); }
  const clearCart = () => setItems([])
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)
  const totalPrice = items.reduce((acc, i) => acc + (i.price * i.quantity), 0)

  // FINAL ORDER FUNCTION - Secure API Route ke zariye Sanity mein save karega
  const placeOrder = async (details: any, adminWA: string) => {
    if (items.length === 0) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: details.name,
          customerPhone: details.phone,
          customerCity: details.city,
          customerAddress: details.address,
          paymentMethod: details.payment,
          items: items.map(i => ({ title: i.title, size: i.size, qty: i.quantity, price: i.price })),
          totalAmount: totalPrice,
          status: 'Pending'
        })
      });

      if (!response.ok) {
        throw new Error('Order save failed');
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      const itemLines = items.map((item, index) => {
        const productLink = baseUrl + "/product/" + item.id;
        return (
          "*" + (index + 1) + ". " + item.title + "*\n" +
          "   Size: " + item.size + " | Qty: " + item.quantity + " | PKR " + (item.price * item.quantity).toLocaleString() + "\n" +
          "   🔗 View: " + productLink
        );
      }).join("\n\n");

      const message =
        "🛍️ *New Order — MultiBrand*\n" +
        "━━━━━━━━━━━━━━━━\n\n" +
        itemLines + "\n\n" +
        "━━━━━━━━━━━━━━━━\n" +
        "💰 *Total: PKR " + totalPrice.toLocaleString() + "*\n" +
        "💳 Payment: " + details.payment + "\n\n" +
        "👤 *Customer Details*\n" +
        "Name: " + details.name + "\n" +
        "Phone: " + details.phone + "\n" +
        "City: " + details.city + "\n" +
        "Address: " + details.address;

      window.open("https://wa.me/" + adminWA + "?text=" + encodeURIComponent(message), "_blank");

      clearCart();
    } catch (error) {
      console.error(error);
      alert("Order save nahi hua, dobara try karein.");
    }
  };

  return <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice, placeOrder }}>{children}</CartContext.Provider>
}

export const useCart = () => { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within CartProvider'); return context; }

// ━━━ CURRENCY CONTEXT — PKR / USD selector poori site ke liye ━━━
export type Currency = "PKR" | "USD";
// Rate ab useUsdRate hook se aata hai (live API + markup) — purana USD_RATE = 250/280 constant hata diya,
// ab markup sirf lib/useUsdRate.ts ke MARKUP se change hota hai (ek hi jagah)

interface CurrencyContextType { currency: Currency; setCurrency: (c: Currency) => void; fmt: (pkr: number) => string; }
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>("PKR")

  // Live dollar rate (open.er-api.com) + markup already included — hook 12 ghante cache karta hai
  const rate = useUsdRate()

  // Customer ki purani choice yaad rakhta hai (localStorage)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mb_currency");
      if (saved === "PKR" || saved === "USD") setCurrencyState(saved);
    } catch (e) {}
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try { window.localStorage.setItem("mb_currency", c); } catch (e) {}
  }

  // PKR amount ko selected currency ki string bana deta hai
  // USD = PKR / rate — is liye useUsdRate ka FIXED (÷ 1.20) version zaroori hai:
  // PKR 18,000 => $72 (fair $60 + 20% upar)
  const fmt = (pkr: number) => {
    const n = Number(pkr || 0);
    if (currency === "USD") return "$" + (n / rate).toLocaleString("en-US", { maximumFractionDigits: 2 });
    return "PKR " + n.toLocaleString("en-US");
  }

  return <CurrencyContext.Provider value={{ currency, setCurrency, fmt }}>{children}</CurrencyContext.Provider>
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  // Admin panel pe navbar/footer nahi chahiye
  const hideNavbar = router.pathname.indexOf("/admin") === 0
  return (
    <CurrencyProvider>
      <CartProvider>
        {!hideNavbar && <Navbar />}
        <Component {...pageProps} />
        {!hideNavbar && <Footer />}
      </CartProvider>
    </CurrencyProvider>
  )
}