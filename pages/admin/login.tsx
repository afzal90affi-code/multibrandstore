"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { loginAdmin, isAdminLoggedIn, ADMIN_USERNAME, ADMIN_PASSWORD } from "../../lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (loginAdmin(username.trim(), password.trim())) {
      router.replace("/admin");
      return;
    }
    setError("Username ya password ghalat hai.");
  };

  return (
    <>
      <Head>
        <title>Admin Login | MultiBrand</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
        
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-rose-500" placeholder="" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-rose-500" placeholder="" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-sm transition-colors">Login</button>
          </form>
        </div>
      </div>
    </>
  );
}
