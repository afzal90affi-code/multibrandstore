"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../../lib/sanity"; // ✅ Sanity Client
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { ArrowLeft, Trash2, LogOut, Upload, Plus, X } from "lucide-react"; // ✅ Plus & X icons added
import AdminFooter from "../../../components/AdminFooter";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    title: "", price: "", category: "", sizes: [] as string[], inStock: true, featured: false,
    image: "", image2: "", // Preview ke liye URLs
    imageAssetId: "", image2AssetId: "", // Sanity save ke liye IDs
    // 🆕 NEW: Product Details
    description: "",
    highlights: [] as string[],
    material: "",
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // Image upload state
  const [highlightInput, setHighlightInput] = useState(""); // 🆕 NEW: For highlight input
  const sizeOptions = ["S", "M", "L", "XL"];
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // ✅ Sanity se Product Fetch Karna
  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;
    
    const fetchProduct = async () => {
      try {
        // 🆕 NEW: description, highlights, material query mein add kiye
        const query = `*[_type == "product" && _id == $productId][0] {
          _id, title, price, sizes, inStock, featured, description, highlights, material,
          "category": category->name,
          "image": image.asset->url,
          "imageAssetId": image.asset->_id,
          "image2": image2.asset->url,
          "image2AssetId": image2.asset->_id
        }`;
        const data = await client.fetch(query, { productId: String(id) });
        
        if (!data) {
          alert("Product nahi mila");
          router.replace("/admin/products");
          return;
        }

        setForm({
          title: data.title || "",
          price: String(data.price || ""),
          category: data.category || "",
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          inStock: data.inStock !== false,
          featured: data.featured || false,
          image: data.image || "",
          imageAssetId: data.imageAssetId || "",
          image2: data.image2 || "",
          image2AssetId: data.image2AssetId || "",
          // 🆕 NEW: Data ko state mein load karna
          description: data.description || "",
          highlights: Array.isArray(data.highlights) ? data.highlights : [],
          material: data.material || "",
        });
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [authorized, router.isReady, id, router]);

  // ✅ Image Upload Function
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
      } else {
        alert("Image upload failed");
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // 🆕 NEW: Add Highlight
  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (trimmed && !form.highlights.includes(trimmed)) {
      setForm({ ...form, highlights: [...form.highlights, trimmed] });
      setHighlightInput("");
    }
  };

  // 🆕 NEW: Remove Highlight
  const removeHighlight = (index: number) => {
    setForm({
      ...form,
      highlights: form.highlights.filter((_, i) => i !== index),
    });
  };

  // ✅ Update Product Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(id),
          title: form.title,
          price: Number(form.price),
          sizes: form.sizes,
          inStock: form.inStock,
          featured: form.featured,
          imageAssetId: form.imageAssetId, 
          image2AssetId: form.image2AssetId,
          // 🆕 NEW: Details submit karna
          description: form.description,
          highlights: form.highlights,
          material: form.material,
        })
      });

      if (res.ok) {
        alert("Product update ho gaya");
      } else {
        alert("Update failed");
      }
    } catch (error) {
      alert("Error updating product");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Product
  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is product ko delete karna chahte hain?")) return;
    try {
      await fetch(`/api/products?id=${String(id)}`, { method: 'DELETE' });
      router.replace("/admin/products");
    } catch (error) {
      alert("Error deleting product");
    }
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
          
          {/* 🆕 NEW: Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Product ki detail likhein... (fabric, fit, care instructions waghera)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 resize-vertical"
            />
          </div>

          {/* 🆕 NEW: Material */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
            <input
              value={form.material}
              onChange={(e) => setForm({...form, material: e.target.value})}
              placeholder="e.g. 100% Cotton, Lawn, Silk..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* 🆕 NEW: Highlights */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Highlights</label>
            <div className="flex gap-2">
              <input
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                placeholder="e.g. Premium quality fabric"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={addHighlight}
                className="flex items-center gap-1 px-4 py-3 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition whitespace-nowrap"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {form.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category text input */}
          <input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="Category (e.g. Lawn)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />

          {/* ✅ IMAGE UPLOAD - MAIN */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Main Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" disabled={uploading} />
            </label>
            {form.image && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image} alt="Main preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          {/* ✅ IMAGE UPLOAD - HOVER */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Hover Image (Optional)</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hover')} className="hidden" disabled={uploading} />
            </label>
            {form.image2 && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image2} alt="Hover preview" className="h-48 w-full object-cover" /></div>)}
          </div>

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
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={loading || uploading} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50">{loading ? "Saving..." : "Update Product"}</button>
            <button type="button" onClick={handleDelete} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-sm font-semibold transition-colors">Delete Product</button>
          </div>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}