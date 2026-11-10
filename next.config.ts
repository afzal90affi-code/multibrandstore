import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  pageExtensions: ["ts", "tsx", "js", "jsx"], // pages folder ke liye — rehne do
  poweredByHeader: false, // security: X-Powered-By header hide hota hai
};

export default nextConfig;