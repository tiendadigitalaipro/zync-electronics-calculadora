import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/zync-electronics-calculadora",
  assetPrefix: "/zync-electronics-calculadora",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Firebase Hosting requires trailing slashes for clean URLs
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
