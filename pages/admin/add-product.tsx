"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ FIX: next/router ki jagah next/navigation
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminLoggedIn } from "../../lib/adminAuth";
import AdminFooter from "../../components/AdminFooter";

// ✅ Type Definitions (any hata kar clean code)
interface ProductForm {
  title: string;
  price: string;
  category: string;
  collection: string;
  description: string; // ✅ NEW: Description added
  image: string;
  image2: string;
  sizes: string[];
  inStock: boolean;
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export default function AddProduct() {
  const [form, setForm] = useState<ProductForm>({
    title: "",
    price: "",
    category: "",
    collection: "",
    description: "", // ✅ NEW
    image: "",
    image2: "",
    sizes: [],
    inStock: true,
    featured: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [cats, setCats] = useState<Category[]>([]); // ✅ Type fixed
  const router = useRouter();
  const sizeOptions = ["S", "M", "L", "XL"];

  // ✅ Auth Check
  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  // ✅ Firebase se Categories fetch karna
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCats(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Category))
          .filter((c) => c.active !== false)
      );
    });
    return () => unsub();
  }, []);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // ✅ Type fixed
    e.preventDefault();
    if (!form.title || !form.price || !form.image || !form.category) {
      return alert("Title, Price, Category aur Image zaroor daalein");
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        title: form.title.trim(),
        price: Number(form.price),
        category: form.category.toLowerCase().trim(),
        collection: form.collection.trim(),
        description: form.description.trim(), // ✅ NEW: Description save hoga
        image: form.image.trim(),
        image2: form.image2.trim(),
        sizes: form.sizes,
        inStock: form.inStock,
        featured: form.featured,
        createdAt: serverTimestamp(),
      });
      alert("✅ Product Add ho gaya!");
      setForm({
        title: "",
        price: "",
        category: "",
        collection: "",
        description: "", // ✅ NEW: Reset description
        image: "",
        image2: "",
        sizes: [],
        inStock: true,
        featured: false,
      });
    } catch (err) {
      console.error(err);
      alert("❌ Error: Product save nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <div className="max-w-lg mx-auto flex-1">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Product Title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            required
          />

          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Price (PKR)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            required
          />

          {/* ✅ CATEGORY DROPDOWN */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>
                -- Choose Category --
              </option>
              {cats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.icon} {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                </option>
              ))}
            </select>
            {cats.length === 0 && <p className="text-xs text-red-500 mt-1">Pehle Admin se Categories add karein.</p>}
          </div>

          <input
            value={form.collection}
            onChange={(e) => setForm({ ...form, collection: e.target.value })}
            placeholder="Collection (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
          />

          {/* ✅ NEW: DESCRIPTION TEXTAREA */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Yahan product ki detail likhein (Material, fit, etc.)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <input
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="Main Image URL"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            required
          />
          {form.image && (
            <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={form.image} alt="Main preview" className="h-48 w-full object-cover" />
            </div>
          )}

          <input
            value={form.image2}
            onChange={(e) => setForm({ ...form, image2: e.target.value })}
            placeholder="Hover Image URL (For Beejays Effect)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
          />
          {form.image2 && (
            <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={form.image2} alt="Secondary preview" className="h-48 w-full object-cover" />
            </div>
          )}

          {/* Sizes Checkboxes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Select Sizes</p>
            <div className="grid grid-cols-2 gap-3">
              {sizeOptions.map((size) => (
                <label
                  key={size}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium cursor-pointer transition ${
                    form.sizes.includes(size) ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(size)}
                    onChange={() => {
                      const selected = form.sizes.includes(size) ? form.sizes.filter((item) => item !== size) : [...form.sizes, size];
                      setForm({ ...form, sizes: selected });
                    }}
                    className="h-4 w-4 accent-rose-600"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="w-4 h-4 accent-rose-600" /> In Stock
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-rose-600" /> Featured (Show on Home)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}