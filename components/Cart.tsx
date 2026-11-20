// components/Cart.tsx — PURANA PURA CODE REPLACE KARO
//
// NAYA (is version me): CART AB CENTER MODAL HAI (side drawer nahi):
//   - Pehle bag right side se slide hota tha — ab screen ke BEECH me ek
//     rounded modal khulta hai (fade + scale animation, mobile-friendly)
//   - Modal ki height max 88vh — items ziada hon to PRODUCTS WALA AREA andar
//     scroll hota hai, aur Subtotal/Total + "Order via WhatsApp" button
//     hamesha neechy FIXED rehte hain (scroll karne par bhi nazar se nahi
//     jate)
//   - Products proper show hote hain: image + title + size + price + qty
//     stepper — har item apni poori line ke saath, koi overlap nahi
//
// Pichle version ke features (sab waise hi hain):
//   - USD mode me Select Country field (dropdown UK/USA/Canada + type kar ke
//     koi bhi country) — PKR mode me country khud Pakistan set hoti hai
//   - Order /api/orders pe bhi save hota hai + WA message me Country line
//   - Order confirm hone ke baad bag khali ho jati hai (clearCart)

"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { X, ShoppingCart, MessageCircle, Banknote, Building, Trash2 } from "lucide-react";
import { useCart, useCurrency } from "../pages/_app";
import { motion, AnimatePresence } from "framer-motion";

const WA = "923333010842";
const SITE_URL = "https://multibrandstore.vercel.app";
const DC = 300; // Delivery Charges (PKR) — har order pe flat 300, badalna ho to sirf yahan

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France",
  "Italy", "Spain", "Netherlands", "Belgium", "Ireland", "Norway", "Sweden",
  "Denmark", "Switzerland", "Austria", "UAE", "Saudi Arabia", "Qatar", "Kuwait",
  "Oman", "Bahrain", "Turkey", "Malaysia",
];

export default function Cart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { items, removeFromCart, updateQty, totalItems, totalPrice, clearCart } = useCart();
  const { currency, fmt } = useCurrency();
  const [checkout, setCheckout] = useState({ name: "", phone: "", city: "", address: "", country: "", payment: "COD" });

  const grandTotal = totalPrice + DC;

  const handlePlaceOrder = async () => {
    // USD mode me country zaroori — PKR mode me Pakistan khud set
    const orderCountry = currency === "USD" ? checkout.country.trim() : "Pakistan";
    if (currency === "USD" && !orderCountry) {
      alert("Please select or type your country");
      return;
    }
    if (!checkout.name || !checkout.phone || !checkout.city || !checkout.address) {
      alert("Please fill all fields");
      return;
    }

    // Order hamesha PKR me banta hai (payment PKR me hoti hai)
    const itemLines = items.map((item, i) =>
      "*" + (i + 1) + ". " + item.title + "*\n" +
      "   Size: " + item.size + " | Qty: " + item.quantity + " | PKR " + (item.price * item.quantity).toLocaleString() + "\n" +
      "   🔗 Product: " + SITE_URL + "/product/" + item.id + "\n" +
      "   🖼️ Image: " + item.image
    ).join("\n\n");

    const message =
      "🛍️ *New Order — MultiBrand*\n" +
      "━━━━━━━━━━━━━━━━\n\n" +
      itemLines + "\n\n" +
      "━━━━━━━━━━━━━━━━\n" +
      "🚚 *Delivery Charges: PKR " + DC.toLocaleString() + "*\n" +
      "💰 *Total: PKR " + grandTotal.toLocaleString() + "*\n" +
      "💳 Payment: " + checkout.payment + "\n\n" +
      "👤 *Customer Details*\n" +
      "Name: " + checkout.name + "\n" +
      "Phone: " + checkout.phone + "\n" +
      "🌍 Country: " + orderCountry + "\n" +
      "City: " + checkout.city + "\n" +
      "Address: " + checkout.address;

    // Order admin ke system me save (Sanity) — fail ho to bhi WhatsApp zaroor khulega
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: checkout.name,
          customerPhone: checkout.phone,
          customerCity: checkout.city,
          customerAddress: checkout.address,
          customerCountry: orderCountry,
          paymentMethod: checkout.payment,
          items: items.map(i => ({ title: i.title, size: i.size, qty: i.quantity, price: i.price })),
          totalAmount: grandTotal,
          status: "Pending",
        }),
      });
      if (!res.ok) console.error("Order save failed — WhatsApp se confirm ho jayega");
    } catch (e) {
      console.error("Order save error — WhatsApp se confirm ho jayega", e);
    }

    // WhatsApp confirm — order seedha admin ko
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(message), "_blank");

    clearCart();
    setCheckout({ name: "", phone: "", city: "", address: "", country: "", payment: "COD" });
    onClose();
    router.push("/");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* ━━━ CENTER MODAL — side drawer ki jagah ab screen ke beech me khulta hai ━━━
              max-h-[88vh]: screen se lamba nahi hoga. flex-col: header upar fix,
              beech wala area scroll, footer (total + button) neechy fix. */}
          <motion.div
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full max-w-[460px] max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* ━━━ HEADER (fixed top) ━━━ */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-display text-2xl font-medium text-gray-900 tracking-wide">Your Bag</h3>
                <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* ━━━ SCROLL AREA — products + delivery details (ziada items hon to SIRF yeh hissa scroll hota hai) ━━━ */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 text-sm">Your bag is empty</p>
                  <button onClick={onClose} className="mt-4 text-[12px] tracking-widest uppercase font-medium text-gray-900 underline underline-offset-4">Continue Shopping</button>
                </div>
              ) : (
                <>
                  {/* ━━━ PRODUCTS — har item poori line ke saath, overlap nahi ━━━ */}
                  <div className="px-6 py-4 space-y-5">
                    {items.map((item) => (
                      <div key={item.id + "-" + item.size} className="flex gap-4">
                        <div className="w-[80px] h-[100px] rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="text-[13.5px] font-medium text-gray-900 leading-snug truncate">{item.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">Size: {item.size}</p>
                          <p className="text-[13px] font-semibold text-gray-900 mt-1.5">{fmt(item.price)}</p>
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                              <button onClick={() => updateQty(item.id, item.size, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">−</button>
                              <span className="w-7 text-center text-[12px] font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.size, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id, item.size)} className="text-gray-300 hover:text-red-400 transition-colors ml-auto">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ━━━ DELIVERY DETAILS (products ke neechy, scroll me hi) ━━━ */}
                  <div className="px-6 py-4 space-y-3 bg-gray-50/50 border-t border-gray-100">
                    <h4 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500">Delivery Details</h4>
                    {[
                      { key: "name", placeholder: "Full Name" },
                      { key: "phone", placeholder: "WhatsApp Number" },
                    ].map(({ key, placeholder }) => (
                      <input key={key} type="text" placeholder={placeholder} value={(checkout as any)[key]}
                        onChange={(e) => setCheckout({ ...checkout, [key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                    ))}

                    {/* SELECT COUNTRY — sirf USD (international) mode me show hota hai */}
                    {currency === "USD" && (
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-1.5">Select Country</p>
                        <input list="mb-countries" type="text" value={checkout.country}
                          onChange={(e) => setCheckout({ ...checkout, country: e.target.value })}
                          placeholder="Type or select country"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                        <datalist id="mb-countries">
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    )}

                    {[
                      { key: "city", placeholder: "City" },
                      { key: "address", placeholder: "Complete Address" },
                    ].map(({ key, placeholder }) => (
                      <input key={key} type="text" placeholder={placeholder} value={(checkout as any)[key]}
                        onChange={(e) => setCheckout({ ...checkout, [key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                    ))}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {["COD", "Bank Transfer"].map((method) => (
                        <button key={method} onClick={() => setCheckout({ ...checkout, payment: method })}
                          className={"flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-medium border transition-all " + (checkout.payment === method ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                          {method === "COD" ? <Banknote size={13} /> : <Building size={13} />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ━━━ FOOTER (fixed bottom) — Subtotal / Total / Order button HAMESHA nazar
                rehte hain, chahe upar products scroll ho rahay hon ━━━ */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Subtotal</span>
                  <span className="text-[13px] font-medium text-gray-900">{fmt(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[13px] text-gray-500">Delivery Charges</span>
                  <span className="text-[13px] font-medium text-gray-900">{fmt(DC)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[13px] text-gray-500">Total</span>
                  <span className="font-display text-2xl font-medium text-gray-900">{fmt(grandTotal)}</span>
                </div>

                <button onClick={handlePlaceOrder}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-gray-800 text-white font-medium py-3.5 rounded-xl text-[13px] tracking-wider uppercase transition-colors mt-3">
                  <MessageCircle size={15} strokeWidth={1.5} /> Order via WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}