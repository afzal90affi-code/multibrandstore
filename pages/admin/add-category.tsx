"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminLoggedIn } from "../../lib/adminAuth";
import AdminFooter from "../../components/AdminFooter";

export default function AddCategory() {
  const [form, setForm] = useState({ name: "", icon: "👗", image: "", collection: "", active: true });
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.image) return alert("Name aur Image URL zaroor daalein");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "categories"), { 
        name: form.name.toLowerCase().trim(), 
        icon: form.icon, 
        image: form.image,
        collection: form.collection.trim(),
        active: form.active, 
        createdAt: serverTimestamp() 
      });
      alert("✅ Category Add ho gayi!");
      setForm({ name: "", icon: "👗", image: "", collection: "", active: true });
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
          <input value={form.collection} onChange={(e) => setForm({...form, collection: e.target.value})} placeholder="Collection (optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} placeholder="Icon Emoji (e.g., 🌸)" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" />
          <input value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} placeholder="Image URL" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rose-500" required />
          {form.image && (
            <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={form.image} alt="Category preview" className="h-56 w-full object-cover" />
            </div>
          )}
          
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-rose-600" />
            Active (Show on Website)
          </label>

          <button type="submit" disabled={loading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Category"}
          </button>
        </form>
      </div>
      <AdminFooter />
    </div>
  );
}