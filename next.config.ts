import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'], // ✅ Yeh line Next.js ko pages folder dikhayegi
};

export default nextConfig;