"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { isAdminLoggedIn } from "../../lib/adminAuth";
import { ArrowLeft, Upload } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function AddCategory() {
  const [form, setForm] = useState({ 
    name: "", icon: "👗", image: "", imageAssetId: "", active: true 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  // ✅ Image Upload Function (With Exact Error Tracking)
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
        // ✅ 'prev' use karna hai taake purana data lost na ho
        setForm(prev => ({ ...prev, image: data.url, imageAssetId: data.assetId }));
      } else {
        // ✅ AB YE EXACT ERROR DIKHEGA JO SANITY DE RAHI HAI
        alert("Upload Failed! Error: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      alert("Frontend Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Category Submit Function
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.imageAssetId) return alert("Name aur Image zaroor daalein");
    
    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.toLowerCase().trim(),
          icon: form.icon,
          active: form.active,
          image: form.imageAssetId 
        })
      });

      if (res.ok) {
        alert("✅ Category Add ho gayi!");
        setForm({ name: "", icon: "👗", image: "", imageAssetId: "", active: true });
      } else {
        alert("❌ Error: Category save nahi hui.");
      }
    } catch (err) {
      alert("❌ Error: Category save nahi hui.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <div className="max-w-lg mx-auto flex-1">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mb-6">Add New Category</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Category Name (e.g., Lawn)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., 🌸)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />

          {/* IMAGE UPLOAD */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Category Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.image && (
              <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <img src={form.image} alt="Category preview" className="h-56 w-full object-cover" />
              </div>
            )}
          </div>
          
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" />
            Active (Show on Website)
          </label>

          <button type="submit" disabled={loading || uploading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Category"}
          </button>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}