"use client"

import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { createContext, useContext, useState, ReactNode } from 'react'
// ✅ Firebase imports hata diye

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
  
  // ✅ FINAL ORDER FUNCTION - Secure API Route ke zariye Sanity mein save karega
  const placeOrder = async (details: any, adminWA: string) => {
    if (items.length === 0) return;
    
    try {
      // 1. Secure Next.js API Route ko call karna (Yeh backend par chalega)
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
      
      // 2. Website ka base URL lo (taaki link properly ban sake)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      // 3. WhatsApp message bana kar aapke number par bhejega (Links ke saath)
      const itemLines = items.map((item, index) => {
        const productLink = `${baseUrl}/product/${item.id}`; 
        return (
          `*${index + 1}. ${item.title}*\n` +
          `   Size: ${item.size} | Qty: ${item.quantity} | PKR ${(item.price * item.quantity).toLocaleString()}\n` +
          `   🔗 View: ${productLink}` 
        );
      }).join('\n\n');

      const message =
        `🛍️ *New Order — MultiBrand*\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `${itemLines}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💰 *Total: PKR ${totalPrice.toLocaleString()}*\n` +
        `💳 Payment: ${details.payment}\n\n` +
        `👤 *Customer Details*\n` +
        `Name: ${details.name}\n` +
        `Phone: ${details.phone}\n` +
        `City: ${details.city}\n` +
        `Address: ${details.address}`;

      // 4. Aapke WhatsApp par redirect
      window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(message)}`, "_blank");
      
      // 5. Cart khaali karega
      clearCart();
    } catch (error) { 
      console.error(error);
      alert("Order save nahi hua, dobara try karein."); 
    }
  };

  return <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice, placeOrder }}>{children}</CartContext.Provider>
}

export const useCart = () => { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within CartProvider'); return context; }

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  )
}