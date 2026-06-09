"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { client } from "../../lib/sanity"; 
import { isAdminLoggedIn } from "../../lib/adminAuth";
import { ArrowLeft, Upload } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function AddSubCategory() {
  const [form, setForm] = useState({ 
    name: "", icon: "✨", image: "", imageAssetId: "", active: true, parentCategory: "" 
  });
  const [categories, setCategories] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // ✅ FIX: Active filter hata diya taake saari categories aayein
   // ✅ Fetch Parent Categories for Dropdown (With Debugging)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const query = `*[_type == "category"] | order(name asc) { _id, name, icon }`;
        const data = await client.fetch(query);
        
        // ✅ YEH CHECK KAREGA KE DATA AA RAHA HAI YA NAHI
        console.log("Fetched Categories for Dropdown:", data);
        
        if (data.length === 0) {
          alert("Sanity mein koi Category mili hi nahi. Pehle Admin se Category Add karein.");
        }

        setCategories(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, parentCategory: data[0]._id })); 
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        alert("Categories fetch nahi ho payi. Console dekhein.");
      }
    };
    fetchCategories();
  }, []);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

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
        // ✅ FIX: ...form ki jagah ...prev use kiya hai
        setForm(prev => ({ ...prev, image: data.url, imageAssetId: data.assetId }));
      } else { 
        alert("Upload Failed! Error: " + (data.error || "Unknown error")); 
      }
    } catch (error: any) { 
      alert("Error uploading: " + error.message); 
    } 
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.parentCategory) return alert("Name aur Parent Category zaroor chunein");
    
    setLoading(true);
    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.toLowerCase().trim(),
          icon: form.icon,
          active: form.active,
          parentCategory: form.parentCategory, 
          image: form.imageAssetId
        })
      });

      if (res.ok) {
        alert("✅ Sub-Category Add ho gayi!");
        setForm({ name: "", icon: "✨", image: "", imageAssetId: "", active: true, parentCategory: form.parentCategory });
      } else {
        alert("❌ Error: Sub-Category save nahi hui.");
      }
    } catch (err) {
      alert("❌ Error: Sub-Category save nahi hui.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <div className="max-w-lg mx-auto flex-1">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mb-6">Add New Sub-Category</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          
          {/* ✅ Parent Category Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category *</label>
            <select 
              value={form.parentCategory} 
              onChange={(e) => setForm({...form, parentCategory: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white" 
              required
            >
              {/* ✅ FIX: Default disabled option add kiya */}
              <option value="" disabled>Select a Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Sub-Category Name (e.g., Unstitched)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., ✨)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />

          {/* Image Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Sub-Category Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.image && (
              <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <img src={form.image} alt="Sub-Category preview" className="h-56 w-full object-cover" />
              </div>
            )}
          </div>
          
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" />
            Active (Show on Website)
          </label>

          <button type="submit" disabled={loading || uploading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Sub-Category"}
          </button>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}