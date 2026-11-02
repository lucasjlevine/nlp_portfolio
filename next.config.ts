import type { NextConfig } from "next";

const repo = "nlp_portfolio";
const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // next/image needs this on Pages
  basePath: isGhPages ? `/${repo}` : "",
  assetPrefix: isGhPages ? `/${repo}/` : "",
  trailingSlash: true,
};

export default nextConfig;