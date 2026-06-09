"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/sanity";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { useCart } from "../pages/_app";

interface SiteNavbarProps {
  showAdminLink?: boolean;
}

export default function SiteNavbar({ showAdminLink = true }: SiteNavbarProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((cat: any) => cat.active !== false);
      setCategories(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-rose-600 text-lg">MultiBrand</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-rose-600">Home</Link>
            <div className="relative">
              <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-rose-600" aria-expanded={open}>
                Collections <ChevronDown size={16} />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="p-3 space-y-2">
                    {categories.length === 0 ? (
                      <div className="text-sm text-gray-500">Loading categories...</div>
                    ) : (
                      categories.map((category) => (
                        <Link key={category.id} href={`/category/${category.name}`} className="block rounded-2xl px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700">
                          {category.name}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {showAdminLink && <Link href="/admin" className="text-sm font-semibold text-gray-700 hover:text-rose-600">Admin</Link>}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/" className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">{totalItems}</span>
              )}
            </Link>
            <div className="md:hidden">
              <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex items-center gap-1 text-gray-700 hover:text-rose-600">
                Categories <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
            {categories.length === 0 ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <Link key={category.id} href={`/category/${category.name}`} className="block rounded-2xl px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700">
                  {category.name}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
