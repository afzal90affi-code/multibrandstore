"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../../lib/sanity";
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { ArrowLeft, Trash2, LogOut, Upload, Plus, X } from "lucide-react";
import AdminFooter from "../../../components/AdminFooter";

interface VariantRow {
  key: string;
  printName: string;
  price: string;
  inStock: boolean;
  vUrl: string;
  vAssetId: string;
}

const newKey = () => Math.random().toString(36).slice(2, 10);

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    title: "", price: "", oldPrice: "",
    category: "", subCategory: "", // dono me Sanity _id store hota hai
    sizes: [] as string[], inStock: true, featured: false,
    image: "", image2: "",
    imageAssetId: "", image2AssetId: "",
    description: "", highlights: [] as string[], material: "",
    variants: [] as VariantRow[],
  });
  const [cats, setCats] = useState<{ _id: string; name: string }[]>([]);
  const [subCats, setSubCats] = useState<{ _id: string; name: string }[]>([]);
  const [wantedSub, setWantedSub] = useState(""); // product ki purani subCategory ko preselect karne ke liye
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [highlightInput, setHighlightInput] = useState("");
  const sizeOptions = ["S", "M", "L", "XL"];
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // ✅ Categories fetch (dropdown ke liye)
  useEffect(() => {
    if (!authorized) return;
    client
      .fetch(`*[_type=="category"] | order(name asc){_id,name}`)
      .then((d: { _id: string; name: string }[]) => setCats(d || []))
      .catch(() => setCats([]));
  }, [authorized]);

  // ✅ Sanity se Product Fetch Karna
  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;

    const fetchProduct = async () => {
      try {
        const query = `*[_type == "product" && _id == $productId][0] {
          _id, title, price, oldPrice, sizes, inStock, featured, description, highlights, material,
          "categoryRef": category._ref,
          "subCategoryRef": subCategory._ref,
          "image": image.asset->url,
          "imageAssetId": image.asset->_id,
          "image2": image2.asset->url,
          "image2AssetId": image2.asset->_id,
          "variants": variants[]{ _key, printName, inStock, price,
            "vUrl": image.asset->url,
            "vAssetId": image.asset->_id }
        }`;
        const data: any = await client.fetch(query, { productId: String(id) });

        if (!data) {
          alert("Product nahi mila");
          router.replace("/admin/products");
          return;
        }

        setForm({
          title: data.title || "",
          price: String(data.price || ""),
          oldPrice: data.oldPrice ? String(data.oldPrice) : "",
          category: data.categoryRef || "",
          subCategory: "",
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          inStock: data.inStock !== false,
          featured: data.featured || false,
          image: data.image || "",
          imageAssetId: data.imageAssetId || "",
          image2: data.image2 || "",
          image2AssetId: data.image2AssetId || "",
          description: data.description || "",
          highlights: Array.isArray(data.highlights) ? data.highlights : [],
          material: data.material || "",
          variants: Array.isArray(data.variants)
            ? data.variants.map((v: any) => ({
                key: v._key || newKey(),
                printName: v.printName || "",
                price: v.price != null ? String(v.price) : "",
                inStock: v.inStock !== false,
                vUrl: v.vUrl || "",
                vAssetId: v.vAssetId || "",
              }))
            : [],
        });
        setWantedSub(data.subCategoryRef || "");
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [authorized, router.isReady, id, router]);

  // ✅ SubCategories fetch jab category change ho
  useEffect(() => {
    if (!form.category) { setSubCats([]); return; }
    client
      .fetch(`*[_type=="subCategory" && parentCategory._ref == $catId] | order(name asc){_id,name}`, { catId: form.category })
      .then((d: { _id: string; name: string }[] | null) => {
        const list = d || [];
        setSubCats(list);
        if (wantedSub && list.some((s) => s._id === wantedSub)) {
          setForm((prev) => ({ ...prev, subCategory: wantedSub }));
          setWantedSub("");
        } else {
          setForm((prev) => (list.some((s) => s._id === prev.subCategory) ? prev : { ...prev, subCategory: "" }));
        }
      })
      .catch(() => setSubCats([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  // ✅ Image Upload Function (main / hover)
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

  // ✅ Variant (Design) Upload
  const handleVariantUpload = async (e: any, idx: number) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm(prev => ({
          ...prev,
          variants: prev.variants.map((v, i) => (i === idx ? { ...v, vUrl: data.url, vAssetId: data.assetId } : v)),
        }));
      } else {
        alert("Image upload failed");
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Variant helpers
  const addVariant = () =>
    setForm(prev => ({ ...prev, variants: [...prev.variants, { key: newKey(), printName: "", price: "", inStock: true, vUrl: "", vAssetId: "" }] }));

  const removeVariant = (key: string) =>
    setForm(prev => ({ ...prev, variants: prev.variants.filter(v => v.key !== key) }));

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setForm(prev => ({ ...prev, variants: prev.variants.map(v => (v.key === key ? { ...v, ...patch } : v)) }));

  // ✅ Add Highlight
  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (trimmed && !form.highlights.includes(trimmed)) {
      setForm({ ...form, highlights: [...form.highlights, trimmed] });
      setHighlightInput("");
    }
  };

  // ✅ Remove Highlight
  const removeHighlight = (index: number) => {
    setForm({ ...form, highlights: form.highlights.filter((_, i) => i !== index) });
  };

  // ✅ Update Product Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;

    const missingImg = form.variants.some((v) => v.printName.trim() && !v.vAssetId);
    if (missingImg) {
      alert("Ek design ka naam likha hai magar photo missing hai — photo upload karein ya naam khaali chhod dein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(id),
          title: form.title,
          price: Number(form.price),
          oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
          category: form.category,
          subCategory: form.subCategory || undefined,
          sizes: form.sizes,
          inStock: form.inStock,
          featured: form.featured,
          imageAssetId: form.imageAssetId,
          image2AssetId: form.image2AssetId || undefined,
          description: form.description,
          highlights: form.highlights,
          material: form.material,
          variants: form.variants
            .filter((v) => v.printName.trim())
            .map((v) => ({
              printName: v.printName.trim(),
              price: v.price ? Number(v.price) : undefined,
              inStock: v.inStock,
              imageAssetId: v.vAssetId || undefined,
            })),
        }),
      });

      if (res.ok) {
        alert("Product update ho gaya ✅ (website par 5 min me dikh jayega)");
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

  const descLen = form.description.trim().length;
  const descColor = descLen >= 400 ? "text-green-600" : descLen >= 150 ? "text-amber-600" : "text-red-500";
  const descMsg = descLen >= 400
    ? "Behtareen! Google ke liye strong description."
    : descLen >= 150
    ? "Acha hai — 400+ characters SEO ke liye best hote hain."
    : "Kam hai — kam az kam 150 characters likhein (fabric, fit, care).";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Edit Product | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-2xl mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-gray-500 mt-1">Update product details, designs or delete it.</p>
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

          {/* TITLE + counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Product Title</label>
              <span className={`text-xs font-medium ${form.title.length >= 30 && form.title.length <= 65 ? "text-green-600" : "text-amber-600"}`}>
                {form.title.length}/65
              </span>
            </div>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Product Title (30-65 characters SEO ke liye best)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          </div>

          {/* PRICE + OLD PRICE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="Price (PKR)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
            <input type="number" value={form.oldPrice} onChange={(e) => setForm({...form, oldPrice: e.target.value})} placeholder="Old Price (Sale ke liye, optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          </div>

          {/* CATEGORY + SUBCATEGORY dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => { setWantedSub(""); setForm({ ...form, category: e.target.value, subCategory: "" }); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Category select karein</option>
              {form.category && !cats.some((c) => c._id === form.category) && (
                <option value={form.category}>Purani category</option>
              )}
              {cats.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.subCategory}
              onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              disabled={!form.category}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-rose-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">SubCategory (optional)</option>
              {subCats.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION + SEO counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description <span className="text-xs font-normal text-gray-400">(SEO ke liye bohat zaroori — Google isi ko parhta hai)</span>
              </label>
              <span className={`text-xs font-medium ${descColor}`}>{descLen} chars</span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Product ki detail likhein... (fabric, fit, care instructions, embroidery detail waghera)"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 resize-y"
            />
            <p className={`text-xs mt-1 ${descColor}`}>{descMsg}</p>
          </div>

          {/* MATERIAL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Material <span className="text-xs font-normal text-gray-400">(Google shopping + filters ke liye)</span></label>
            <input
              value={form.material}
              onChange={(e) => setForm({...form, material: e.target.value})}
              placeholder="e.g. 100% Cotton, Lawn, Silk..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* HIGHLIGHTS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Highlights <span className="text-xs font-normal text-gray-400">({form.highlights.length} added — 3 se 5 behtar)</span>
            </label>
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

          {/* MAIN IMAGE */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Main Image</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" disabled={uploading} />
            </label>
            {form.image && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image} alt="Main preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          {/* HOVER IMAGE */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Hover Image (Optional)</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              <Upload size={16} /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hover')} className="hidden" disabled={uploading} />
            </label>
            {form.image2 && (<div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"><img src={form.image2} alt="Hover preview" className="h-48 w-full object-cover" /></div>)}
          </div>

          {/* 🆕 DESIGNS / PRINTS (VARIANTS) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Designs / Prints (Variants)</p>
                <p className="text-xs text-gray-500 mt-0.5">Aik product ke 10-12 similar designs — sirf naam + photo har design ka. Common fields (title, price, description) upar aik dafa fill hote hain.</p>
              </div>
              <button type="button" onClick={addVariant} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition whitespace-nowrap">
                <Plus size={14} /> Add Design
              </button>
            </div>

            {form.variants.length === 0 && (
              <p className="text-xs text-gray-400">Abhi koi design add nahi hui. Product page par customer thumbnails switch kar ke har design dekh sakega.</p>
            )}

            {form.variants.map((v, i) => (
              <div key={v.key} className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500">Design #{i + 1}</p>
                  <button type="button" onClick={() => removeVariant(v.key)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={v.printName}
                    onChange={(e) => updateVariant(v.key, { printName: e.target.value })}
                    placeholder="Design ka naam (e.g. Blue Print)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                  />
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(v.key, { price: e.target.value })}
                    placeholder="Price (khali = main price)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition">
                    <Upload size={14} /> {v.vUrl ? "Photo badlein" : "Photo upload karein"}
                    <input type="file" accept="image/*" onChange={(e) => handleVariantUpload(e, i)} className="hidden" disabled={uploading} />
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={v.inStock} onChange={(e) => updateVariant(v.key, { inStock: e.target.checked })} className="w-4 h-4 accent-rose-600" /> In Stock
                  </label>
                </div>
                {v.vUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img src={v.vUrl} alt={`Design ${i + 1}`} className="h-32 w-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SIZES */}
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

          {/* IN STOCK + FEATURED */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} className="w-4 h-4 accent-rose-600" /> In Stock</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-rose-600" /> Featured</label>
          </div>

          {/* 🆕 GOOGLE SEO PREVIEW */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Google Preview (SEO)</p>
            <p className="text-lg leading-snug text-blue-700 truncate">{(form.title || "Product Title").slice(0, 60)} | MultiBrand</p>
            <p className="text-xs text-green-700 mt-0.5">multibrandstore.vercel.app › product › {String(id)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {(form.description || "Product ki detail likhein — Google search result me yahi description dikhaega.").slice(0, 158)}
            </p>
            <p className="text-xs text-gray-400 mt-2">Ye preview auto-generate hota hai title + description se. In dono ko behtar banayein to Google ranking behtar hogi.</p>
          </div>

          {/* BUTTONS */}
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