"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../../lib/sanity"; // ✅ Sanity Client
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { ArrowLeft, Trash2, LogOut, Upload } from "lucide-react"; // ✅ Upload icon added
import AdminFooter from "../../../components/AdminFooter";

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ 
    name: "", icon: "👗", image: "", imageAssetId: "", active: true 
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // Image upload state
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // ✅ Sanity se Category Fetch Karna
  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;
    
    const fetchCategory = async () => {
      try {
        const query = `*[_type == "category" && _id == $categoryId][0] {
          _id, name, icon, active,
          "image": image.asset->url,
          "imageAssetId": image.asset->_id
        }`;
        const data = await client.fetch(query, { categoryId: String(id) });
        
        if (!data) {
          alert("Category nahi mili");
          router.replace("/admin/categories");
          return;
        }

        setForm({
          name: data.name || "",
          icon: data.icon || "👗",
          image: data.image || "",
          imageAssetId: data.imageAssetId || "",
          active: data.active !== false,
        });
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [authorized, router.isReady, id, router]);

  // ✅ Image Upload Function
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        setForm(prev => ({ ...prev, image: data.url, imageAssetId: data.assetId }));
      } else {
        alert("Image upload failed");
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Update Category Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(id),
          name: form.name.toLowerCase().trim(),
          icon: form.icon,
          active: form.active,
          imageAssetId: form.imageAssetId, // Yeh ID API mein image reference ban jayegi
        })
      });

      if (res.ok) {
        alert("Category update ho gayi");
      } else {
        alert("Update failed");
      }
    } catch (error) {
      alert("Error updating category");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Category
  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is category ko delete karna chahte hain?")) return;
    try {
      await fetch(`/api/categories?id=${String(id)}`, { method: 'DELETE' });
      router.replace("/admin/categories");
    } catch (error) {
      alert("Error deleting category");
    }
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
          
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., 🌸)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />

          {/* ✅ IMAGE UPLOAD - CATEGORY */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Category Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.image && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image} alt="Category preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" /> Active</label>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={loading || uploading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50">{loading ? "Saving..." : "Update Category"}</button>
            <button type="button" onClick={handleDelete} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-sm font-semibold transition-colors">Delete Category</button>
          </div>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}