"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { client } from "../../lib/sanity";
import { isAdminLoggedIn } from "../../lib/adminAuth";
import { ArrowLeft, Upload } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", price: "", category: "", subCategory: "", 
    sizes: [] as string[], inStock: true, featured: false,
    image: "", imageAssetId: "", 
    image2: "", image2AssetId: ""
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const sizeOptions = ["S", "M", "L", "XL"];

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      const data = await client.fetch(`*[_type == "category"] | order(name asc) { _id, name, icon }`);
      setCategories(data);
      if (data.length > 0) setForm(prev => ({ ...prev, category: data[0]._id }));
    };
    fetchCats();
  }, []);

  // Fetch Sub-Categories based on selected Category
  useEffect(() => {
    if (!form.category) return;
    const fetchSubCats = async () => {
      const query = `*[_type == "subCategory" && parentCategory._ref == $catId] | order(name asc) { _id, name }`;
      const data = await client.fetch(query, { catId: form.category });
      setSubCategories(data);
      // Reset subcategory when category changes
      setForm(prev => ({ ...prev, subCategory: data.length > 0 ? data[0]._id : "" }));
    };
    fetchSubCats();
  }, [form.category]);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  const handleImageUpload = async (e: any, field: 'main' | 'hover') => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        if (field === 'main') {
          setForm(prev => ({ ...prev, image: data.url, imageAssetId: data.assetId }));
        } else {
          setForm(prev => ({ ...prev, image2: data.url, image2AssetId: data.assetId }));
        }
      } else { alert("Upload Failed: " + data.error); }
    } catch (error: any) { alert("Error: " + error.message); } 
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || !form.imageAssetId) {
      return alert("Title, Price, Category aur Main Image zaroor daalein");
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          price: Number(form.price),
          category: form.category,
          subCategory: form.subCategory || undefined,
          sizes: form.sizes,
          inStock: form.inStock,
          featured: form.featured,
          image: form.imageAssetId, // Main image asset ID
          image2: form.image2AssetId || undefined, // Hover image asset ID
        })
      });

      if (res.ok) {
        alert("✅ Product Add ho gaya!");
        router.push("/admin/products");
      } else {
        const errorData = await res.json();
        alert("❌ Error: " + (errorData.error || "Product save nahi hua."));
      }
    } catch (err) {
      alert("❌ Error: Product save nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <div className="max-w-lg mx-auto flex-1">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Product Title" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          
          <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="Price (PKR)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white" required>
              {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>))}
            </select>
          </div>

          {/* Sub-Category Dropdown (Dynamic) */}
          {subCategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Category</label>
              <select value={form.subCategory} onChange={(e) => setForm({...form, subCategory: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white">
                {subCategories.map((sc) => (<option key={sc._id} value={sc._id}>{sc.name}</option>))}
              </select>
            </div>
          )}

          {/* Main Image Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Main Image *</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Main Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" disabled={uploading} />
            </label>
            {form.image && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"><img src={form.image} alt="Main preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          {/* Hover Image Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Hover Image (Optional)</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Hover Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hover')} className="hidden" disabled={uploading} />
            </label>
            {form.image2 && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"><img src={form.image2} alt="Hover preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          {/* Sizes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Select Sizes</p>
            <div className="grid grid-cols-2 gap-3">
              {sizeOptions.map((size) => (
                <label key={size} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium cursor-pointer transition ${form.sizes.includes(size) ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"}`}>
                  <input type="checkbox" checked={form.sizes.includes(size)} onChange={() => {
                    const selected = form.sizes.includes(size) ? form.sizes.filter((item) => item !== size) : [...form.sizes, size];
                    setForm({ ...form, sizes: selected });
                  }} className="h-4 w-4 accent-rose-600" />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} className="w-4 h-4 accent-rose-600" /> In Stock</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-rose-600" /> Featured</label>
          </div>

          <button type="submit" disabled={loading || uploading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}