import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy icon/date/dnd packages to only what each route uses
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
};

export default nextConfig;
