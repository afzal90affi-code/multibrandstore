// FILE: pages/admin/subcategories/[id].tsx  (PURANA PURA CODE REPLACE KARO)
"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../../lib/sanity";
import { isAdminLoggedIn, logoutAdmin } from "../../../lib/adminAuth";
import { slugify } from "../../../lib/site";
import { ArrowLeft, Trash2, LogOut, Upload, Loader2 } from "lucide-react";
import AdminFooter from "../../../components/AdminFooter";

const inputCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400";
const labelCls = "block text-sm font-semibold text-neutral-700 mb-1.5";

export default function EditSubCategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: "", icon: "✨", image: "", imageAssetId: "", active: true, parentCategory: "", description: "",
  });
  const [categories, setCategories] = useState<{ _id: string; name: string; icon?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // auth guard
  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    setAuthorized(true);
  }, [router]);

  // parent categories
  useEffect(() => {
    client.fetch(`*[_type == "category"] | order(name asc) { _id, name, icon }`)
      .then(setCategories)
      .catch(() => {});
  }, []);

  // sub-category data load
  useEffect(() => {
    if (!authorized || !router.isReady || !id) return;
    const fetchSubCategory = async () => {
      try {
        const query = `*[_type == "subCategory" && _id == $subCatId][0] {
          _id, name, icon, active, description,
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
          description: data.description || "",
        });
      } catch (err) {
        console.error("Error fetching sub-category:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubCategory();
  }, [authorized, router.isReady, id, router]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const formData = new FormData();
    formData.append("image", file); // /api/upload ka wahi field name jo pehle se chal raha hai
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setForm((p) => ({ ...p, image: data.url, imageAssetId: data.assetId }));
      else setError("Upload fail: " + (data.error || "unknown error"));
    } catch {
      setError("Upload error — dobara koshish karein");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setMsg("");
    if (!id || !form.parentCategory) { setError("Parent Category zaroor select karein"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/subcategories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(id),
          name: form.name.toLowerCase().trim(),
          icon: form.icon,
          active: form.active,
          parentCategory: form.parentCategory,
          imageAssetId: form.imageAssetId,
          description: form.description.trim(), // ← NAYA FIELD
        }),
      });
      if (res.ok) setMsg("✅ Sub-Category update ho gayi! Website pe ~5 minute me naya version a jayega.");
      else setError("❌ Update fail hua. Dobara koshish karein.");
    } catch {
      setError("❌ Error updating sub-category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Kya aap yakeen hain ke is sub-category ko delete karna chahte hain?")) return;
    try {
      await fetch(`/api/subcategories?id=${String(id)}`, { method: "DELETE" });
      router.replace("/admin/subcategories");
    } catch {
      alert("Error deleting sub-category.");
    }
  };

  // ---- SEO helpers (live) ----
  const nameLen = form.name.trim().length;
  const descLen = form.description.trim().length;
  const parentName = categories.find((c) => c._id === form.parentCategory)?.name || "category";
  const prettyName = form.name ? form.name.charAt(0).toUpperCase() + form.name.slice(1) : "Sub-Category";
  const slugUrl = form.name ? `/category/${slugify(parentName)}/${slugify(form.name)}` : "/category/...";
  const googleTitle = `${prettyName} Collection | MultiBrand`;
  const googleDesc = form.description.trim()
    ? form.description.trim().slice(0, 158)
    : "SEO description likho to yahan Google me ye text dikhega — 120+ characters best hai.";

  if (authorized === null || loading) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-600">Loading sub-category...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 text-neutral-900">
      <Head><title>Edit Sub-Category | Admin | MultiBrand</title></Head>

      {/* Header */}
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/admin/subcategories" className="rounded-full p-1.5 hover:bg-neutral-100">
            <ArrowLeft size={20} className="text-neutral-600" />
          </Link>
          <h1 className="text-lg font-bold text-neutral-800">Edit Sub-Category</h1>
          <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. BASIC INFO */}
          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">1. Basic Info</h2>

            <div>
              <label className={labelCls}>Sub-Category Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jaise: Embroidered Lawn" required />
              <p className="mt-1 text-xs text-neutral-400">
                Naam URL ka hissa banta hai — chhota aur saaf rakhein ({nameLen} chars).
                Live URL: <span className="font-mono text-rose-600">{slugUrl}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Icon (emoji)</label>
                <input className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="✨" />
              </div>
              <div>
                <label className={labelCls}>Parent Category *</label>
                <select className={inputCls} value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })} required>
                  <option value="" disabled>Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 2. IMAGE */}
          <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">2. Image</h2>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-300 bg-rose-50/50 px-4 py-6 text-sm font-medium text-rose-600 hover:bg-rose-50">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {uploading ? "Uploading..." : "Tap to upload new image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.image && (
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <img src={form.image} alt="Sub-Category preview" className="h-48 w-full object-cover" />
              </div>
            )}
          </section>

          {/* 3. SEO */}
          <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">3. SEO Description (Google ke liye)</h2>
            <textarea
              className={inputCls + " min-h-[110px]"}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Is collection ka 2-3 line intro: kya hai, kis ke liye best hai, fabric/style ka zikr... (120+ characters)"
            />
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Ye text sub-category page pe aur Google me dikhega</span>
              <span className={descLen >= 120 ? "font-medium text-green-600" : descLen > 0 ? "text-amber-500" : "text-red-500"}>{descLen} chars</span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-2 text-[11px] font-bold tracking-wide text-neutral-400">GOOGLE PREVIEW</p>
              <p className="text-[13px] text-[#4d5156]">multibrandstore.vercel.app{slugUrl}</p>
              <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{googleTitle}</p>
              <p className="mt-1 line-clamp-2 text-[13px] text-[#4d5156]">{googleDesc}</p>
            </div>
          </section>

          {/* 4. STATUS + ACTIONS */}
          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">4. Status</h2>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-rose-600" />
              Active (Show on Website)
            </label>
            <div className="flex flex-wrap gap-3 pt-1">
              <button type="submit" disabled={saving || uploading} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                {saving ? "Saving..." : "Update Sub-Category"}
              </button>
              <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </section>

        </form>
      </div>
      <AdminFooter />
    </div>
  );
}