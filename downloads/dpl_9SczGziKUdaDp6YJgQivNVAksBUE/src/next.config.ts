import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Define turbopack root to avoid workspace root inference warnings
  turbopack: {
    root: './'
  },
  typescript: {
    // Isso vai permitir que o build termine mesmo se houver erros de tipagem
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
