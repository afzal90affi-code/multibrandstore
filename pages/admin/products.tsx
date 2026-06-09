"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../lib/sanity"; // ✅ Sanity Client
import { isAdminLoggedIn, logoutAdmin } from "../../lib/adminAuth";
import { ArrowLeft, Trash2, Edit3, LogOut } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  // ✅ Sanity se Products Fetch Karna (GROQ Query)
  useEffect(() => {
    if (!authorized) return;
    
    const fetchProducts = async () => {
      try {
        const query = `*[_type == "product"] | order(_createdAt desc) {
          _id, title, price, inStock, sizes,
          "category": category->name,
          "image": image.asset->url,
          "image2": image2.asset->url
        }`;
        const data = await client.fetch(query);
        setProducts(data.map((p: any) => ({ ...p, id: p._id })));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [authorized]);

  // ✅ Secure API Route se Delete Karna
  const handleDelete = async (id: string) => {
    if (!confirm("Kya aap yakeen hain ke is product ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Product delete nahi hua. Dobara try karein.");
      }
    } catch (error) {
      alert("Error deleting product.");
    }
  };

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6">
      <Head>
        <title>Manage Products | Admin | MultiBrand</title>
      </Head>
      <div className="max-w-6xl mx-auto flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Manage Products</h1>
            <p className="text-gray-500 mt-1">Edit or delete products from the admin panel.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/admin/add-product" className="rounded-2xl bg-rose-600 text-white px-4 py-3 text-sm font-semibold hover:bg-rose-700">Add Product</Link>
          <Link href="/admin/categories" className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:bg-gray-100">Manage Categories</Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">No products found. Add a new product to begin.</div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 grid gap-4">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-gray-200">
                  <img src={product.image || product.image2 || "/"} alt={product.title || "Product"} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${product.inStock ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="mt-2">
                  <h2 className="text-lg font-bold text-gray-900">{product.title || "Untitled"}</h2>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Category: {product.category || "-"}</p>
                    <p className="mt-2">Sizes: {Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "Free Size"}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xl font-extrabold text-gray-900">PKR {Number(product.price || 0).toLocaleString()}</p>
                    <div className="flex gap-3">
                      <Link href={`/admin/edit-product/${product.id}`} className="inline-flex items-center justify-center rounded-2xl border border-rose-600 text-rose-600 px-3 py-2 text-sm font-semibold hover:bg-rose-50"> <Edit3 size={16} /> Edit</Link>
                      <button onClick={() => handleDelete(product.id)} className="inline-flex items-center justify-center rounded-2xl bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700"><Trash2 size={16} /> Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminFooter />
    </div>
  );
}