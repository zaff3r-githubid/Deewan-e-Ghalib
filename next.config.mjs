/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true" || !process.env.VERCEL;

const nextConfig = {
  ...(isStatic ? {
    output: "export",
    basePath: "/Deewan-e-Ghalib",
  } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
