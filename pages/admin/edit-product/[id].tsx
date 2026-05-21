"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { ArrowLeft, Trash2, LogOut } from "lucide-react";
import AdminFooter from "../../../components/AdminFooter";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ title: "", price: "", category: "", collection: "", image: "", image2: "", sizes: [] as string[], inStock: true, featured: false });
  const [loading, setLoading] = useState(true);
  const sizeOptions = ["S", "M", "L", "XL"];
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;
    const productId = String(id);
    async function loadProduct() {
      const snap = await getDoc(doc(db, "products", productId));
      if (!snap.exists()) {
        alert("Product nahi mila");
        router.replace("/admin/products");
        return;
      }
      const data = snap.data();
      setForm({
        title: data.title || "",
        price: String(data.price || ""),
        category: data.category || "",
        collection: data.collection || "",
        image: data.image || "",
        image2: data.image2 || "",
        sizes: Array.isArray(data.sizes) ? data.sizes : data.sizes ? String(data.sizes).split(",").map((s) => s.trim()).filter(Boolean) : [],
        inStock: data.inStock !== false,
        featured: data.featured || false,
      });
      setLoading(false);
    }
    loadProduct();
  }, [authorized, router.isReady, id, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    await updateDoc(doc(db, "products", String(id)), {
      title: form.title,
      price: Number(form.price),
      category: form.category.toLowerCase().trim(),
      collection: form.collection.trim(),
      image: form.image,
      image2: form.image2,
      sizes: form.sizes,
      inStock: form.inStock,
      featured: form.featured,
    });
    setLoading(false);
    alert("Product update ho gaya");
  };

  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is product ko delete karna chahte hain?")) return;
    await deleteDoc(doc(db, "products", String(id)));
    router.replace("/admin/products");
  };

  if (authorized === null || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading product...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Edit Product | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-lg mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-gray-500 mt-1">Update product details or delete it.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin/products" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Back
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Product Title" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="Price (PKR)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          <input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="Category" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.collection} onChange={(e) => setForm({...form, collection: e.target.value})} placeholder="Collection (optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} placeholder="Main Image URL" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          {form.image && (<div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image} alt="Main preview" className="h-48 w-full object-cover" /></div>)}
          <input value={form.image2} onChange={(e) => setForm({...form, image2: e.target.value})} placeholder="Hover Image URL" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          {form.image2 && (<div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image2} alt="Secondary preview" className="h-48 w-full object-cover" /></div>)}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Select Sizes</p>
            <div className="grid grid-cols-2 gap-3">
              {sizeOptions.map((size) => (
                <label key={size} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium cursor-pointer transition ${form.sizes.includes(size) ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"}`}>
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(size)}
                    onChange={() => {
                      const selected = form.sizes.includes(size)
                        ? form.sizes.filter((item) => item !== size)
                        : [...form.sizes, size];
                      setForm({ ...form, sizes: selected });
                    }}
                    className="h-4 w-4 accent-rose-600"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} className="w-4 h-4 accent-rose-600" /> In Stock</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-rose-600" /> Featured</label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50">{loading ? "Saving..." : "Update Product"}</button>
            <button type="button" onClick={handleDelete} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-sm font-semibold transition-colors">Delete Product</button>
          </div>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}
