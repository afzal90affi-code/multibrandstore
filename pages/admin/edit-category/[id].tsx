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

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ name: "", icon: "👗", image: "", collection: "", active: true });
  const [loading, setLoading] = useState(true);
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
    const categoryId = String(id);
    async function loadCategory() {
      const snap = await getDoc(doc(db, "categories", categoryId));
      if (!snap.exists()) {
        alert("Category nahi mili");
        router.replace("/admin/categories");
        return;
      }
      const data = snap.data();
      setForm({
        name: data.name || "",
        icon: data.icon || "👗",
        image: data.image || "",
        collection: data.collection || "",
        active: data.active !== false,
      });
      setLoading(false);
    }
    loadCategory();
  }, [authorized, router.isReady, id, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    await updateDoc(doc(db, "categories", String(id)), {
      name: form.name.toLowerCase().trim(),
      icon: form.icon,
      image: form.image,
      collection: form.collection.trim(),
      active: form.active,
    });
    setLoading(false);
    alert("Category update ho gaya");
  };

  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is category ko delete karna chahte hain?")) return;
    await deleteDoc(doc(db, "categories", String(id)));
    router.replace("/admin/categories");
  };

  if (authorized === null || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading category...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Edit Category | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-lg mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Edit Category</h1>
            <p className="text-gray-500 mt-1">Update category details or delete it.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin/categories" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Back
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Category Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          <input value={form.collection} onChange={(e) => setForm({...form, collection: e.target.value})} placeholder="Collection (optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., 🌸)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} placeholder="Image URL" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          {form.image && (<div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image} alt="Category preview" className="h-48 w-full object-cover" /></div>)}
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" /> Active</label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50">{loading ? "Saving..." : "Update Category"}</button>
            <button type="button" onClick={handleDelete} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-sm font-semibold transition-colors">Delete Category</button>
          </div>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}
