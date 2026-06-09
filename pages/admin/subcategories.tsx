"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../lib/sanity";
import { isAdminLoggedIn, logoutAdmin } from "../../lib/adminAuth";
import { ArrowLeft, Trash2, Edit3, LogOut } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function ManageSubCategories() {
  const router = useRouter();
  const [subCats, setSubCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const fetchSubCats = async () => {
      try {
        // Sub-category ke saath uski Parent Category ka naam bhi fetch kar rahe hain
        const query = `*[_type == "subCategory"] | order(name asc) {
          _id, name, icon, active,
          "parentName": parentCategory->name
        }`;
        const data = await client.fetch(query);
        setSubCats(data.map((c: any) => ({ ...c, id: c._id })));
      } catch (error) {
        console.error("Error fetching sub-categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubCats();
  }, [authorized]);

  const handleDelete = async (id: string) => {
    if (!confirm("Kya aap yakeen hain ke is sub-category ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/subcategories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubCats(prev => prev.filter(sc => sc.id !== id));
      } else {
        alert("Sub-Category delete nahi hui.");
      }
    } catch (error) {
      alert("Error deleting sub-category.");
    }
  };

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Manage Sub-Categories | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-6xl mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Manage Sub-Categories</h1>
            <p className="text-gray-500 mt-1">Edit or delete sub-categories.</p>
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
          <Link href="/admin/add-subcategory" className="rounded-2xl bg-rose-600 text-white px-4 py-3 text-sm font-semibold hover:bg-rose-700">Add Sub-Category</Link>
          <Link href="/admin/categories" className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:bg-gray-100">Manage Categories</Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Loading sub-categories...</div>
        ) : subCats.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">No sub-categories found. Add a new one to begin.</div>
        ) : (
          <div className="space-y-4">
            {subCats.map((sc) => (
              <div key={sc.id} className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{sc.icon} {sc.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Parent Category: <span className="font-medium text-gray-800 capitalize">{sc.parentName || "Unknown"}</span></p>
                  <p className="text-xs text-gray-400 mt-1">Status: {sc.active === false ? "Hidden" : "Active"}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/admin/edit-subcategory/${sc.id}`} className="inline-flex items-center justify-center rounded-2xl border border-rose-600 text-rose-600 px-4 py-3 text-sm font-semibold hover:bg-rose-50 transition-colors">
                  <Edit3 size={16} className="mr-1" /> Edit
                     </Link>
               <button onClick={() => handleDelete(sc.id)} className="inline-flex items-center justify-center rounded-2xl bg-red-600 text-white px-4 py-3 text-sm font-semibold hover:bg-red-700 transition-colors">
              <Trash2 size={16} className="mr-1" /> Delete
                </button>
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