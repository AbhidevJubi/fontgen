import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use dynamic rendering (default) instead of static export
  // This allows API routes and server-side functionality
  // The Netlify plugin will handle building this correctly
};

export default nextConfig;
