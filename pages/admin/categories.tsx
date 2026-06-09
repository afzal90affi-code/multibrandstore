"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
// ✅ Firebase hata kar Sanity client import kiya
import { client } from "../../lib/sanity";
import { isAdminLoggedIn, logoutAdmin } from "../../lib/adminAuth";
import { ArrowLeft, Trash2, Edit3, LogOut } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function ManageCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  // ✅ Sanity se Data Fetch Karna (GROQ Query)
  useEffect(() => {
    if (!authorized) return;
    
    const fetchCategories = async () => {
      try {
        const query = `*[_type == "category"] | order(name asc) {
          _id, name, icon, active,
          "image": image.asset->url
        }`;
        const data = await client.fetch(query);
        // Sanity _id deti hai, UI compatibility ke liye isse id mein map kara
        setCategories(data.map((c: any) => ({ ...c, id: c._id })));
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [authorized]);

   // ✅ Secure API Route se Delete Karna (With Error Alert)
  const handleDelete = async (id: string) => {
    if (!confirm("Kya aap yakeen hain ke is category ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json(); // ✅ Response ko parse karna zaroori hai
      
      if (res.ok) {
        // UI mein turant update (Optimistic UI)
        setCategories(prev => prev.filter(cat => cat.id !== id));
      } else {
        // ✅ AB YE EXACT ERROR DIKHEGA JO SANITY DE RAHI HAI
        alert("Delete Failed! Error: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      alert("Frontend Error: " + error.message);
    }
  };

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Manage Categories | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-6xl mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Manage Categories</h1>
            <p className="text-gray-500 mt-1">Edit or delete categories from the admin panel.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/admin/add-category" className="rounded-2xl bg-rose-600 text-white px-4 py-3 text-sm font-semibold hover:bg-rose-700">Add Category</Link>
          <Link href="/admin/products" className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:bg-gray-100">Manage Products</Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">No categories found. Add a new category to begin.</div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr] items-start">
                <div className="flex items-start gap-4">
                  <img src={category.image || "/"} alt={category.name || "Category"} className="w-28 h-28 rounded-3xl object-cover border border-gray-200" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{category.name || "Untitled"}</h2>
                    <p className="text-sm text-gray-600 mt-1">Icon: {category.icon || "-"}</p>
                    {category.collection && <p className="text-sm text-gray-600">Collection: {category.collection}</p>}
                    <p className="text-sm text-gray-600 mt-2">Status: {category.active === false ? "Hidden" : "Active"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <Link href={`/admin/edit-category/${category.id}`} className="inline-flex items-center justify-center rounded-2xl border border-rose-600 text-rose-600 px-4 py-3 text-sm font-semibold hover:bg-rose-50"> <Edit3 size={16} /> Edit</Link>
                  <button onClick={() => handleDelete(category.id)} className="inline-flex items-center justify-center rounded-2xl bg-red-600 text-white px-4 py-3 text-sm font-semibold hover:bg-red-700"><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminFooter />
    </div>
  );
}