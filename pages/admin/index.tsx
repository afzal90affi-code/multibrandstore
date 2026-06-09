"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { client } from "../../lib/sanity"; // ✅ Sanity Client for Dynamic Stats
import { Package, LayoutGrid, ArrowLeft, LogOut, Edit3, Trash2, ShoppingBag, Tags, BarChart3, Clock } from "lucide-react";
import { isAdminLoggedIn, logoutAdmin } from "../../lib/adminAuth";
import AdminFooter from "../../components/AdminFooter";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // ✅ Dynamic Stats States
  const [stats, setStats] = useState({ products: 0, categories: 0, subcategories: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  // ✅ Fetch Real-Time Stats from Sanity
  useEffect(() => {
    if (!authorized) return;
    
    const fetchDashboardData = async () => {
      try {
        // GROQ Query to fetch counts and recent orders in one go
        const query = `{
          "products": count(*[_type == "product"]),
          "categories": count(*[_type == "category"]),
          "subcategories": count(*[_type == "subCategory"]),
          "orders": count(*[_type == "order"]),
          "recentOrders": *[_type == "order"] | order(orderedAt desc)[0...5] {
            _id, customerName, totalAmount, status, orderedAt
          }
        }`;
        
        const data = await client.fetch(query);
        setStats({
          products: data.products || 0,
          categories: data.categories || 0,
          subcategories: data.subcategories || 0,
          orders: data.orders || 0,
        });
        setRecentOrders(data.recentOrders || []);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [authorized]);

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading admin...</div>;
  }

  // Dynamic Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 p-6 md:p-10">
      <Head>
        <title>Admin Dashboard | MultiBrand</title>
        {/* ✅ SEO: Admin pages should NEVER be indexed by Google */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-7xl mx-auto flex-1 w-full">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{greeting} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your store today.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/" className="flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <ArrowLeft size={16} /> View Site
            </Link>
            <button onClick={() => { logoutAdmin(); router.replace("/admin/login"); }} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* ✅ DYNAMIC STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center"><Package className="text-rose-600" size={20} /></div>
              <Link href="/admin/products" className="text-[11px] text-rose-600 font-semibold hover:underline">View All</Link>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{loadingStats ? "..." : stats.products}</h3>
            <p className="text-xs text-gray-500 mt-1">Total Products</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Tags className="text-purple-600" size={20} /></div>
              <Link href="/admin/categories" className="text-[11px] text-purple-600 font-semibold hover:underline">View All</Link>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{loadingStats ? "..." : stats.categories}</h3>
            <p className="text-xs text-gray-500 mt-1">Categories</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><LayoutGrid className="text-blue-600" size={20} /></div>
              <Link href="/admin/subcategories" className="text-[11px] text-blue-600 font-semibold hover:underline">View All</Link>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{loadingStats ? "..." : stats.subcategories}</h3>
            <p className="text-xs text-gray-500 mt-1">Sub-Categories</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><ShoppingBag className="text-green-600" size={20} /></div>
              <Link href="/admin/orders" className="text-[11px] text-green-600 font-semibold hover:underline">View All</Link>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{loadingStats ? "..." : stats.orders}</h3>
            <p className="text-xs text-gray-500 mt-1">Total Orders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ✅ RECENT ORDERS TABLE */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock size={18} className="text-gray-400" /> Recent Orders</h2>
              <Link href="/admin/orders" className="text-[11px] text-rose-600 font-semibold hover:underline">View All Orders</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5 font-medium">Customer</th>
                    <th className="py-3 px-5 font-medium">Amount</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loadingStats ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-400">Loading orders...</td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-400">No orders yet</td></tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-5 font-medium text-gray-800">{order.customerName || "Unknown"}</td>
                        <td className="py-3 px-5 text-gray-600">PKR {(order.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-gray-400 text-xs">
                          {order.orderedAt ? new Date(order.orderedAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ QUICK ACTIONS (Sidebar Style) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-gray-400" /> Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/add-product" className="flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 text-gray-700 hover:text-rose-700 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors"><Package size={16} className="text-rose-600" /></div>
                <span className="text-sm font-medium">Add New Product</span>
              </Link>
              <Link href="/admin/add-category" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors"><Tags size={16} className="text-purple-600" /></div>
                <span className="text-sm font-medium">Add Category</span>
              </Link>
              <Link href="/admin/add-subcategory" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors"><LayoutGrid size={16} className="text-blue-600" /></div>
                <span className="text-sm font-medium">Add Sub-Category</span>
              </Link>
              <div className="border-t border-gray-100 my-2"></div>
              <Link href="/admin/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors"><Edit3 size={16} className="text-gray-600" /></div>
                <span className="text-sm font-medium">Manage Products</span>
              </Link>
              <Link href="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors"><Trash2 size={16} className="text-gray-600" /></div>
                <span className="text-sm font-medium">Manage Categories</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
      <AdminFooter />
    </div>
  );
}