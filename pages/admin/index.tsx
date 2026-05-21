"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Package, LayoutGrid, ArrowLeft, LogOut, Edit3, Trash2 } from "lucide-react";
import { isAdminLoggedIn, logoutAdmin } from "../../lib/adminAuth";
import AdminFooter from "../../components/AdminFooter";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading admin...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-4xl mx-auto flex-1">
        
        {/* Header with Back Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your store</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/" className="flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> Back to Site
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/add-product" className="flex flex-col items-center gap-3 bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
            <Package className="text-rose-600" size={28} />
            <span className="font-semibold text-sm">Add Product</span>
          </Link>

          <Link href="/admin/products" className="flex flex-col items-center gap-3 bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <Edit3 className="text-blue-600" size={28} />
            <span className="font-semibold text-sm">Manage Products</span>
          </Link>

          <Link href="/admin/add-category" className="flex flex-col items-center gap-3 bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <LayoutGrid className="text-purple-600" size={28} />
            <span className="font-semibold text-sm">Add Category</span>
          </Link>

          <Link href="/admin/categories" className="flex flex-col items-center gap-3 bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-amber-300 transition-all">
            <Trash2 className="text-amber-600" size={28} />
            <span className="font-semibold text-sm">Manage Categories</span>
          </Link>
        </div>

      </div>
      <AdminFooter />
    </div>
  );
}