// FILE: pages/admin/add-product.tsx  (PURANA PURA CODE REPLACE KARO)
"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/router";
import { client } from "../../lib/sanity"; // apna purana import
import { isAdminLoggedIn } from "../../lib/adminAuth";
import { ArrowLeft, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import AdminFooter from "../../components/AdminFooter"; // agar path alag hai to APNA wala likhna

const BRAND_SUGGESTIONS = [
  "Khaadi", "Sapphire", "Gul Ahmed", "Maria B", "Sana Safinaz", "Limelight",
  "Bonanza Satrangi", "Alkaram Studio", "Nishat Linen", "Charizma", "Baroque",
  "Elaf", "Ramsha", "Tawakkal", "Agha Noor", "Zaha", "Erina", "Mahay",
];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "Free Size"]; // apne hisab se badal sakte ho

type Uploaded = { url: string; assetId: string };
type VariantRow = { printName: string; price: string; inStock: boolean; uploading: boolean; image: Uploaded | null };

const inputCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400";
const labelCls = "block text-sm font-semibold text-neutral-700 mb-1.5";

const emptyVariant = (): VariantRow => ({ printName: "", price: "", inStock: true, uploading: false, image: null });

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", brand: "", price: "", oldPrice: "",
    category: "", subCategory: "", description: "", material: "",
    inStock: true, featured: false,
  });
  const [sizes, setSizes] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [image, setImage] = useState<Uploaded | null>(null);
  const [image2, setImage2] = useState<Uploaded | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cats, setCats] = useState<{ _id: string; name: string; icon?: string }[]>([]);
  const [subs, setSubs] = useState<{ _id: string; name: string }[]>([]);

  // auth guard
  useEffect(() => {
    if (!isAdminLoggedIn()) router.replace("/admin/login");
  }, [router]);

  // categories load
  useEffect(() => {
    client.fetch(`*[_type=="category"] | order(name asc){_id,name,icon}`).then(setCats).catch(() => {});
  }, []);

  // subcategories jab category change ho
  useEffect(() => {
    if (!form.category) { setSubs([]); return; }
    client
      .fetch(`*[_type=="subCategory" && parentCategory._ref == $catId] | order(name asc){_id,name}`, { catId: form.category })
      .then((d: { _id: string; name: string }[]) => {
        setSubs(d || []);
        setForm((f) => ({ ...f, subCategory: d && d.length ? d[0]._id : "" }));
      })
      .catch(() => setSubs([]));
  }, [form.category]);

  async function uploadImage(file: File): Promise<Uploaded> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("upload failed");
    const data = await res.json();
    return { url: data.url, assetId: data.assetId };
  }

  async function handleMainImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try { setImage(await uploadImage(file)); } catch { setError("Image upload fail ho gayi"); } finally { setUploading(false); }
  }

  async function handleImage2(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try { setImage2(await uploadImage(file)); } catch { setError("Image upload fail ho gayi"); } finally { setUploading(false); }
  }

  const updateVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  async function handleVariantImage(i: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateVariant(i, { uploading: true });
    try {
      const up = await uploadImage(file);
      updateVariant(i, { image: up, uploading: false });
    } catch {
      updateVariant(i, { uploading: false });
    }
  }

  // ---- SEO helpers (live) ----
  const titleLen = form.title.trim().length;
  const descLen = form.description.trim().length;
  const googleTitle = `${form.title || "Product ka naam"}${form.brand ? ` - ${form.brand}` : ""} | MultiBrand`;
  const googleDesc = form.description.trim()
    ? form.description.trim().slice(0, 158)
    : "Description likho to yahan Google me ye text dikhega — 120+ characters best hai.";
  const imgCount = 1 + (image2 ? 1 : 0) + variants.filter((v) => v.image).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (!form.title.trim()) return setError("Product title zaroori hai");
    if (!form.price) return setError("Price zaroori hai");
    if (!form.category) return setError("Category select karein");
    if (!image) return setError("Main image upload karein");

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        price: Number(form.price),
        category: form.category,
        sizes,
        inStock: form.inStock,
        featured: form.featured,
        image: image.assetId,
      };
      if (form.brand.trim()) payload.brand = form.brand.trim();
      if (form.oldPrice && Number(form.oldPrice) > 0) payload.oldPrice = Number(form.oldPrice);
      if (form.subCategory) payload.subCategory = form.subCategory;
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.material.trim()) payload.material = form.material.trim();
      const hs = highlights.map((h) => h.trim()).filter(Boolean);
      if (hs.length) payload.highlights = hs;
      const vs = variants
        .filter((v) => v.printName.trim() && v.image)
        .map((v) => ({
          printName: v.printName.trim(),
          image: v.image!.assetId,
          inStock: v.inStock,
          ...(v.price && Number(v.price) > 0 ? { price: Number(v.price) } : {}),
        }));
      if (vs.length) payload.variants = vs;
      if (image2) payload.image2 = image2.assetId;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");

      setSuccess(true);
      setForm({ title: "", brand: "", price: "", oldPrice: "", category: form.category, subCategory: "", description: "", material: "", inStock: true, featured: false });
      setSizes([]); setHighlights([""]); setVariants([]); setImage(null); setImage2(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Product save nahi hua. Dobara koshish karein.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <button onClick={() => router.back()} className="rounded-full p-1.5 hover:bg-neutral-100">
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <h1 className="text-lg font-bold text-neutral-800">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✓ Product save ho gaya! Naya product add karne ke liye form khali kar diya gaya hai.
          </div>
        )}

        {/* 1. BASIC INFO */}
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">1. Basic Info</h2>

          <div>
            <label className={labelCls}>Product Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Jaise: Embroidered Lawn 3 Piece Unstitched" />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-neutral-400">Google me 60 characters tak acha dikhta hai</span>
              <span className={titleLen <= 60 ? "font-medium text-green-600" : titleLen <= 70 ? "text-amber-500" : "text-red-500"}>{titleLen}/60</span>
            </div>
          </div>

          {/* BRAND — naya option */}
          <div>
            <label className={labelCls}>Brand Name</label>
            <input className={inputCls} list="brand-list" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Jaise: Khaadi, Sapphire, Gul Ahmed, Ramsha..." />
            <datalist id="brand-list">
              {BRAND_SUGGESTIONS.map((b) => <option key={b} value={b} />)}
            </datalist>
            <p className="mt-1 text-xs text-neutral-400">List se chuno YA apna brand naam likho — product page aur Google dono pe brand dikhega.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (PKR) *</label>
              <input className={inputCls} type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="4500" />
            </div>
            <div>
              <label className={labelCls}>Old Price (Sale)</label>
              <input className={inputCls} type="number" inputMode="numeric" value={form.oldPrice} onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))} placeholder="6000" />
              <p className="mt-1 text-xs text-neutral-400">Sale hai to original price yahan — crossed price dikhega.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category *</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {cats.map((c) => <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sub Category</label>
              <select className={inputCls} value={form.subCategory} onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))} disabled={!subs.length}>
                <option value="">{subs.length ? "Select" : "N/A"}</option>
                {subs.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* 2. IMAGES + VARIANTS */}
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">2. Images</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Main Image *</label>
              {image ? (
                <div className="relative">
                  <img src={image.url} alt="main" className="h-36 w-full rounded-lg border object-cover" />
                  <label className="absolute bottom-2 right-2 cursor-pointer rounded bg-white/90 px-2 py-1 text-xs hover:bg-white">
                    Change
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainImage} />
                  </label>
                </div>
              ) : (
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50">
                  {uploading ? <Loader2 size={22} className="animate-spin text-rose-500" /> : <Upload size={22} className="text-rose-400" />}
                  <span className="text-xs font-medium text-rose-500">{uploading ? "Uploading..." : "Tap to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleMainImage} />
                </label>
              )}
            </div>
            <div>
              <label className={labelCls}>Hover Image (optional)</label>
              {image2 ? (
                <div className="relative">
                  <img src={image2.url} alt="hover" className="h-36 w-full rounded-lg border object-cover" />
                  <label className="absolute bottom-2 right-2 cursor-pointer rounded bg-white/90 px-2 py-1 text-xs hover:bg-white">
                    Change
                    <input type="file" accept="image/*" className="hidden" onChange={handleImage2} />
                  </label>
                </div>
              ) : (
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100">
                  {uploading ? <Loader2 size={22} className="animate-spin text-neutral-400" /> : <Upload size={22} className="text-neutral-400" />}
                  <span className="text-xs font-medium text-neutral-500">{uploading ? "Uploading..." : "Tap to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage2} />
                </label>
              )}
            </div>
          </div>

          {/* VARIANTS — 10-12 similar designs */}
          <div className="border-t border-dashed border-neutral-200 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <label className={labelCls + " mb-0"}>Similar Designs / Prints</label>
                <p className="text-xs text-neutral-400">1 product ke 10-12 designs — har design ka naam + photo (Khaadi style).</p>
              </div>
              <button type="button" onClick={() => setVariants([...variants, emptyVariant()])} className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                <Plus size={14} /> Add Design
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500">DESIGN #{i + 1}</span>
                    <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex gap-3">
                    <label className="flex h-20 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-neutral-300 bg-white hover:border-rose-400">
                      {v.uploading ? <Loader2 size={16} className="animate-spin text-rose-500" /> : v.image ? <img src={v.image.url} alt="" className="h-full w-full object-cover" /> : <Upload size={16} className="text-neutral-400" />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImage(i, e)} />
                    </label>
                    <div className="flex-1 space-y-2">
                      <input className={inputCls} value={v.printName} onChange={(e) => updateVariant(i, { printName: e.target.value })} placeholder="Design ka naam (jaise: Navy Blue Floral)" />
                      <div className="flex items-center gap-3">
                        <input className={inputCls + " w-28"} type="number" inputMode="numeric" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} placeholder="Price (opt.)" />
                        <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <input type="checkbox" checked={v.inStock} onChange={(e) => updateVariant(i, { inStock: e.target.checked })} className="accent-rose-600" />
                          In Stock
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. DETAILS (SEO) */}
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">3. Details (SEO ke liye bohat important)</h2>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={inputCls + " min-h-[110px]"} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Fabric kya hai, kitne pieces hain, embroidery ka style, wash care... (120+ characters likhein)" />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-neutral-400">Google ye text product page se padhta hai</span>
              <span className={descLen >= 120 ? "font-medium text-green-600" : descLen > 0 ? "text-amber-500" : "text-red-500"}>{descLen} chars</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Highlights (key features)</label>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} value={h} onChange={(e) => setHighlights(highlights.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "Jaise: Premium embroidered lawn fabric" : "Aur ek feature..."} />
                  {highlights.length > 1 && (
                    <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-neutral-300 px-2.5 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setHighlights([...highlights, ""])} className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"><Plus size={13} /> Add feature</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Material / Fabric</label>
              <input className={inputCls} value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} placeholder="Jaise: Lawn, Khaddar, Chiffon" />
            </div>
            <div>
              <label className={labelCls}>Sizes</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SIZE_OPTIONS.map((s) => (
                  <button type="button" key={s} onClick={() => setSizes(sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s])}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sizes.includes(s) ? "border-rose-600 bg-rose-600 text-white" : "border-neutral-300 bg-white text-neutral-600"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. STATUS */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-800">4. Status</h2>
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm((f) => ({ ...f, inStock: !f.inStock }))} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${form.inStock ? "border-green-300 bg-green-50 text-green-700" : "border-neutral-300 bg-neutral-100 text-neutral-500"}`}>
              {form.inStock ? "✓ In Stock" : "Out of Stock"}
            </button>
            <button type="button" onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${form.featured ? "border-amber-300 bg-amber-50 text-amber-700" : "border-neutral-300 bg-neutral-100 text-neutral-500"}`}>
              ★ Featured {form.featured ? "✓" : ""}
            </button>
          </div>
        </section>

        {/* 5. GOOGLE PREVIEW (live) */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-800">5. Google Preview (live)</h2>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-[13px] text-[#4d5156]">multibrandstore.vercel.app › product</p>
            <p className="mt-0.5 line-clamp-1 text-[17px] leading-snug text-[#1a0dab]">{googleTitle}</p>
            <p className="mt-1 line-clamp-2 text-[13px] text-[#4d5156]">{googleDesc}</p>
          </div>
          <p className="mt-2 text-xs text-neutral-400">Total images: {imgCount} · Aise hi tumhara product Google search me dikhega.</p>
        </section>

        <button type="submit" disabled={saving || uploading} className="w-full rounded-xl bg-rose-600 py-3.5 font-bold text-white hover:bg-rose-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>

      <AdminFooter />
    </div>
  );
}