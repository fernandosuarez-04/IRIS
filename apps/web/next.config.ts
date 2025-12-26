import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript - ignorar errores en build de producción
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint - ignorar durante builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
