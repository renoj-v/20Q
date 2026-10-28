import type { NextConfig } from "next";

// Lab routes (*.dev.tsx) are only built in dev, or when previewing variants.
const includeLab = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_VARIANTS === "true";

const nextConfig: NextConfig = {
  // Fully static site (PRD NFR-7). `next build` writes to ./out.
  output: "export",
  images: { unoptimized: true },
  pageExtensions: includeLab ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
  // Production builds skip the dev server's route types (.next/dev/types),
  // which include lab routes that don't exist in the build.
  typescript: { tsconfigPath: process.env.NODE_ENV === "production" ? "tsconfig.build.json" : "tsconfig.json" },
};

export default nextConfig;
