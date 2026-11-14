// FILE: pages/admin/add-product.tsx  (PURANA PURA CODE REPLACE KARO)
import type { ChangeEvent, CSSProperties } from "react";
import { useEffect, useState } from "react";

const PROJECT_ID = "vieoyox0";
const DATASET = "production";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "Free Size", "Unstitched"];

type Uploaded = { assetId: string; url: string };

type DesignRow = {
  id: string;
  name: string;
  uploading: boolean;
  uploading2: boolean;
  uploading3: boolean;
  image: Uploaded | null;
  image2: Uploaded | null;
  image3: Uploaded | null;
  sizes: string[];
};

type CatRow = { _id: string; name: string };

const newId = () => Math.random().toString(36).slice(2, 10);

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 15,
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#333",
  margin: "14px 0 6px",
};

function chipStyle(on: boolean): CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: 20,
    border: on ? "2px solid #c2185b" : "1px solid #bbb",
    background: on ? "#fde7f1" : "#fff",
    color: on ? "#c2185b" : "#444",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };
}

const pinkBtn: CSSProperties = {
  background: "#c2185b",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "12px 22px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  background: "#fff",
  color: "#c2185b",
  border: "1px solid #c2185b",
  borderRadius: 6,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const tinyBtn: CSSProperties = {
  background: "none",
  border: "none",
  color: "#c00",
  fontSize: 12,
  cursor: "pointer",
  padding: 0,
  marginTop: 4,
};

function toggleSize(list: string[], s: string): string[] {
  return list.indexOf(s) >= 0 ? list.filter((x) => x !== s) : list.concat([s]);
}

function previewSrc(up: Uploaded): string {
  if (up.url) return up.url;
  return "https://cdn.sanity.io/images/" + PROJECT_ID + "/" + DATASET + "/" + up.assetId + "?w=200&h=240&fit=crop";
}

// ek design ka photo slot (Photo 1 / 2 / 3)
function PhotoSlot(props: {
  label: string;
  up: Uploaded | null;
  busy: boolean;
  required: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div style={{ width: 110 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 6 }}>{props.label}</div>
      <label
        style={{
          display: "block",
          width: 84,
          height: 100,
          border: "1px dashed #bbb",
          borderRadius: 6,
          cursor: "pointer",
          overflow: "hidden",
          background: "#fafafa",
        }}
      >
        {props.up ? (
          <img src={previewSrc(props.up)} alt={props.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : props.busy ? (
          <span style={{ display: "block", textAlign: "center", marginTop: 40, fontSize: 11, color: "#888" }}>Uploading...</span>
        ) : (
          <span style={{ display: "block", textAlign: "center", marginTop: 40, fontSize: 11, color: "#888" }}>
            {props.required ? "+ Photo" : "+ Optional"}
          </span>
        )}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={props.onPick} />
      </label>
      {props.up ? (
        <button type="button" onClick={props.onClear} style={tinyBtn}>
          remove
        </button>
      ) : null}
    </div>
  );
}

export default function AddCatalogProduct() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [subs, setSubs] = useState<CatRow[]>([]);
  const [catsErr, setCatsErr] = useState(false);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [highlights, setHighlights] = useState("");
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);

  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failed, setFailed] = useState<string[]>([]);
  const [doneMsg, setDoneMsg] = useState("");

  // categories + subcategories Sanity public API se load (naya category bhi khud aa jayega)
  useEffect(() => {
    const cq = encodeURIComponent('*[_type == "category"]{ _id, name } | order(name asc)');
    fetch("https://" + PROJECT_ID + ".api.sanity.io/v1/data/query/" + DATASET + "?query=" + cq)
      .then((r) => r.json())
      .then((d) => setCats((d.result || []) as CatRow[]))
      .catch(() => setCatsErr(true));
    const sq = encodeURIComponent('*[_type == "subCategory"]{ _id, name } | order(name asc)');
    fetch("https://" + PROJECT_ID + ".api.sanity.io/v1/data/query/" + DATASET + "?query=" + sq)
      .then((r) => r.json())
      .then((d) => setSubs((d.result || []) as CatRow[]))
      .catch(() => {});
  }, []);

  function setDesignField(id: string, patch: Partial<DesignRow>) {
    setDesigns((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function uploadImage(file: File): Promise<Uploaded> {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("upload fail");
    const data = await res.json();
    const assetId = data.assetId || data.id || data._id || (data.asset && data.asset._id) || (data.document && data.document._id) || "";
    const url = data.url || (data.asset && data.asset.url) || "";
    if (!assetId) throw new Error("no assetId");
    return { assetId: String(assetId), url: String(url) };
  }

  function handleDesignPhoto(id: string, slot: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (slot === 1) {
      setDesignField(id, { uploading: true });
      uploadImage(file)
        .then((up) => setDesignField(id, { uploading: false, image: up }))
        .catch(() => { setDesignField(id, { uploading: false }); alert("Photo 1 upload fail — dobara try karo"); });
    } else if (slot === 2) {
      setDesignField(id, { uploading2: true });
      uploadImage(file)
        .then((up) => setDesignField(id, { uploading2: false, image2: up }))
        .catch(() => { setDesignField(id, { uploading2: false }); alert("Photo 2 upload fail — dobara try karo"); });
    } else {
      setDesignField(id, { uploading3: true });
      uploadImage(file)
        .then((up) => setDesignField(id, { uploading3: false, image3: up }))
        .catch(() => { setDesignField(id, { uploading3: false }); alert("Photo 3 upload fail — dobara try karo"); });
    }
  }

  async function handleBulkImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const rows: DesignRow[] = files.map(() => ({
      id: newId(), name: "", uploading: true, uploading2: false, uploading3: false,
      image: null, image2: null, image3: null, sizes: [],
    }));
    setDesigns((prev) => prev.concat(rows));
    const ups = await Promise.all(files.map((f) => uploadImage(f).catch(() => null)));
    const okById = new Map<string, Uploaded>();
    rows.forEach((r, i) => {
      const u = ups[i];
      if (u) okById.set(r.id, u);
    });
    setDesigns((prev) =>
      prev
        .filter((r) => okById.has(r.id) || !rows.some((x) => x.id === r.id))
        .map((r) => {
          const u = okById.get(r.id);
          return u ? { ...r, uploading: false, image: u } : r;
        })
    );
    const failCount = rows.length - okById.size;
    if (failCount > 0) alert(failCount + " photo upload fail — unki row hata di gayi. Dobara try karo.");
  }

  function addDesignRow() {
    setDesigns((prev) => prev.concat([{
      id: newId(), name: "", uploading: false, uploading2: false, uploading3: false,
      image: null, image2: null, image3: null, sizes: [],
    }]));
  }

  function removeDesign(id: string) {
    setDesigns((prev) => prev.filter((r) => r.id !== id));
  }

  function applyTopSizes() {
    setDesigns((prev) => prev.map((r) => ({ ...r, sizes: sizes })));
  }

  async function handleSubmit() {
    if (saving) return;
    if (!title.trim()) { alert("Catalog title likho"); return; }
    if (!price.trim()) { alert("Price likho"); return; }
    if (!category) { alert("Category select karo"); return; }
    const rows = designs.filter((d) => d.image);
    if (!rows.length) { alert("Kam az kam ek design ki Photo 1 upload karo"); return; }
    const skipped = designs.length - rows.length;
    if (skipped > 0 && !confirm(skipped + " design row me photo nahi hai — wo skip ho jayengi. Continue?")) return;

    setSaving(true);
    setFailed([]);
    setDoneMsg("");
    setProgress({ done: 0, total: rows.length });
    const fails: string[] = [];
    const failedIds: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const d = rows[i];
      const suffix = d.name.trim() || "Design " + (i + 1);
      const payload: { [k: string]: unknown } = {
        title: title.trim() + " - " + suffix,
        price: Number(price),
        category: category,
        sizes: d.sizes.length ? d.sizes : sizes,
        inStock: inStock,
        featured: featured,
        image: d.image ? d.image.assetId : "",
      };
      if (d.image2) payload.image2 = d.image2.assetId;
      if (d.image3) payload.image3 = d.image3.assetId;
      if (brand.trim()) payload.brand = brand.trim();
      if (oldPrice.trim()) payload.oldPrice = Number(oldPrice);
      if (subCategory) payload.subCategory = subCategory;
      if (description.trim()) payload.description = description.trim();
      if (material.trim()) payload.material = material.trim();
      const hl = highlights.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
      if (hl.length) payload.highlights = hl;
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = "HTTP " + res.status;
          const j = await res.json().catch(() => null);
          if (j && j.error) msg = String(j.error);
          throw new Error(msg);
        }
      } catch (err) {
        const label = "Design " + (i + 1) + (d.name.trim() ? " (" + d.name.trim() + ")" : "");
        fails.push(label + ": " + (err instanceof Error ? err.message : "fail"));
        failedIds.push(d.id);
      }
      setProgress({ done: i + 1, total: rows.length });
    }

    setSaving(false);
    // jo products save ho gaye unki rows hata do — sirf fail wali rows rehne do (dusra Save unhe hi retry karega)
    setDesigns((prev) => prev.filter((r) => failedIds.indexOf(r.id) >= 0 || !rows.some((x) => x.id === r.id)));
    if (failedIds.length) {
      setFailed(fails);
    } else {
      setDoneMsg(rows.length + " products save ho gaye!");
      setTitle(""); setPrice(""); setOldPrice(""); setBrand("");
      setDescription(""); setMaterial(""); setHighlights(""); setSizes([]);
      // category rehta hai — agla catalog same category me turant banao
    }
  }

  const rowsCount = designs.filter((d) => d.image).length;
  const firstRow = designs.filter((d) => d.image)[0];
  const firstSuffix = firstRow ? (firstRow.name.trim() || "Design 1") : "Design 1";
  const googleTitle = title.trim() ? title.trim() + " - " + firstSuffix + " | MultiBrand" : "";

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 24 }}>Add Catalog Products</h1>
      <p style={{ color: "#666", fontSize: 14, marginTop: -6 }}>
        Ek catalog likho, har design ki photos do — har design ka apna product banega (title ke sath Design 1, Design 2...). Har design ke liye alag sizes aur Photo 2 / Photo 3 (optional) bhi de sakte ho.
      </p>

      {/* ===== 1) COMMON DETAILS ===== */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>1) Common details (sab products ke liye)</h2>

        <label style={labelStyle}>Catalog Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: 3 Piece Printed Lawn Suit Summer" style={inputStyle} />
        {googleTitle ? (
          <p style={{ color: "#666", fontSize: 13, margin: "6px 0 0" }}>
            Google me pehla product aise dikhega: <b>{googleTitle}</b>
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px" }}>
            <label style={labelStyle}>Price (PKR) *</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4500" inputMode="numeric" style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label style={labelStyle}>Old Price (optional)</label>
            <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="6000" inputMode="numeric" style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label style={labelStyle}>Brand (optional)</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Gul Ahmed" style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Category *</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="">— select —</option>
          {cats.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        {catsErr ? <p style={{ color: "#c00", fontSize: 13 }}>Categories load nahi hui — page refresh karo.</p> : null}

        <label style={labelStyle}>Sub Category (optional)</label>
        <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} style={inputStyle}>
          <option value="">— koi nahi —</option>
          {subs.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <label style={labelStyle}>Sizes (default — neeche har design me alag bhi kar sakte ho)</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SIZE_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSizes(toggleSize(sizes, s))} style={chipStyle(sizes.indexOf(s) >= 0)}>
              {s}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Description (optional — sab products same)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={inputStyle} />

        <label style={labelStyle}>Fabric / Material (optional)</label>
        <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Lawn" style={inputStyle} />

        <label style={labelStyle}>Highlights (optional — har line ek point)</label>
        <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} placeholder={"Premium printed lawn\nShirt + dupatta"} style={inputStyle} />

        <div style={{ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured (home page)
          </label>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In Stock
          </label>
        </div>
      </div>

      {/* ===== 2) DESIGNS ===== */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>2) Designs (har design = 1 product)</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "10px 0" }}>
          <label style={ghostBtn}>
            + Add photos (multiple)
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleBulkImages} />
          </label>
          <button type="button" onClick={addDesignRow} style={ghostBtn}>+ Khali row</button>
          <button type="button" onClick={applyTopSizes} style={ghostBtn}>Sizes sab designs pe lagao</button>
        </div>

        {designs.length === 0 ? (
          <p style={{ color: "#888", fontSize: 14 }}>Abhi koi design nahi — upar photos select karo ya khali row banao.</p>
        ) : null}

        {designs.map((d, i) => (
          <div key={d.id} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fcfcfc" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ color: "#c2185b" }}>#{i + 1}</b>
              <input
                value={d.name}
                onChange={(e) => setDesignField(d.id, { name: e.target.value })}
                placeholder="Design name (optional) — khali = Design N"
                style={{ ...inputStyle, flex: "1 1 200px", padding: "8px 10px" }}
              />
              <button type="button" onClick={() => removeDesign(d.id)} style={tinyBtn}>remove row</button>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
              <PhotoSlot label="Photo 1 (main)" up={d.image} busy={d.uploading} required={true} onPick={(e) => handleDesignPhoto(d.id, 1, e)} onClear={() => setDesignField(d.id, { image: null })} />
              <PhotoSlot label="Photo 2 (optional)" up={d.image2} busy={d.uploading2} required={false} onPick={(e) => handleDesignPhoto(d.id, 2, e)} onClear={() => setDesignField(d.id, { image2: null })} />
              <PhotoSlot label="Photo 3 (optional)" up={d.image3} busy={d.uploading3} required={false} onPick={(e) => handleDesignPhoto(d.id, 3, e)} onClear={() => setDesignField(d.id, { image3: null })} />
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 6 }}>
                Sizes (is design ke liye) — khali chhoro to upar wale default sizes use honge:
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDesignField(d.id, { sizes: toggleSize(d.sizes, s) })}
                    style={{ ...chipStyle(d.sizes.indexOf(s) >= 0), padding: "4px 10px", fontSize: 12 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 3) SAVE ===== */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || rowsCount === 0}
          style={{ ...pinkBtn, opacity: saving || rowsCount === 0 ? 0.5 : 1 }}
        >
          {saving ? "Saving " + progress.done + "/" + progress.total + "..." : "Save " + rowsCount + " Products"}
        </button>

        {saving ? (
          <div style={{ background: "#eee", borderRadius: 6, height: 10, marginTop: 12 }}>
            <div
              style={{
                background: "#c2185b",
                height: 10,
                borderRadius: 6,
                width: (progress.total ? (progress.done / progress.total) * 100 : 0) + "%",
              }}
            />
          </div>
        ) : null}

        {doneMsg ? <p style={{ color: "#080", fontWeight: 700, marginTop: 10 }}>{doneMsg}</p> : null}

        {failed.length > 0 ? (
          <div style={{ color: "#c00", marginTop: 10, fontSize: 14 }}>
            <b>Save fail:</b>
            <ul style={{ paddingLeft: 20 }}>
              {failed.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            Fail rows upar baqi hain — API theek hone ke baad dobara Save dabao.
          </div>
        ) : null}
      </div>
    </div>
  );
}