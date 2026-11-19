const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  devIndicators: false,
  poweredByHeader: false,
};

export default config;
