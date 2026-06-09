"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../../lib/sanity";
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { ArrowLeft, Trash2, LogOut, Upload } from "lucide-react";
import AdminFooter from "../../../components/AdminFooter";

export default function EditSubCategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ 
    name: "", icon: "✨", image: "", imageAssetId: "", active: true, parentCategory: "" 
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // ✅ Fetch Parent Categories for Dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await client.fetch(`*[_type == "category"] | order(name asc) { _id, name, icon }`);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  // ✅ Fetch Sub-Category Data
  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;
    
    const fetchSubCategory = async () => {
      try {
        const query = `*[_type == "subCategory" && _id == $subCatId][0] {
          _id, name, icon, active,
          "image": image.asset->url,
          "imageAssetId": image.asset->_id,
          "parentCategoryId": parentCategory->_id
        }`;
        const data = await client.fetch(query, { subCatId: String(id) });
        
        if (!data) {
          alert("Sub-Category nahi mili");
          router.replace("/admin/subcategories");
          return;
        }

        setForm({
          name: data.name || "",
          icon: data.icon || "✨",
          image: data.image || "",
          imageAssetId: data.imageAssetId || "",
          active: data.active !== false,
          parentCategory: data.parentCategoryId || "",
        });
      } catch (error) {
        console.error("Error fetching sub-category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubCategory();
  }, [authorized, router.isReady, id, router]);

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
      } else { alert("Upload Failed: " + data.error); }
    } catch (error: any) { alert("Error: " + error.message); } 
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id || !form.parentCategory) return alert("Parent Category zaroor chunein");
    setLoading(true);
    
    try {
      const res = await fetch('/api/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(id),
          name: form.name.toLowerCase().trim(),
          icon: form.icon,
          active: form.active,
          parentCategory: form.parentCategory,
          imageAssetId: form.imageAssetId, // Yeh ID API mein image reference ban jayegi
        })
      });

      if (res.ok) {
        alert("✅ Sub-Category update ho gayi!");
      } else {
        alert("❌ Error: Update failed.");
      }
    } catch (error) {
      alert("❌ Error updating sub-category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is sub-category ko delete karna chahte hain?")) return;
    try {
      await fetch(`/api/subcategories?id=${String(id)}`, { method: 'DELETE' });
      router.replace("/admin/subcategories");
    } catch (error) {
      alert("Error deleting sub-category.");
    }
  };

  if (authorized === null || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading sub-category...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Edit Sub-Category | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-lg mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Edit Sub-Category</h1>
            <p className="text-gray-500 mt-1">Update details or delete it.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin/subcategories" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Back
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Sub-Category Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., ✨)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />

          {/* Parent Category Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category *</label>
            <select 
              value={form.parentCategory} 
              onChange={(e) => setForm({...form, parentCategory: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white" 
              required
            >
              <option value="" disabled>Select a Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Sub-Category Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload New Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.image && (
              <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <img src={form.image} alt="Sub-Category preview" className="h-48 w-full object-cover" />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" />
            Active (Show on Website)
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={loading || uploading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? "Saving..." : "Update Sub-Category"}
            </button>
            <button type="button" onClick={handleDelete} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-sm font-semibold transition-colors">
              Delete Sub-Category
            </button>
          </div>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}