/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  // Tells the browser whether company logos are on (a logo.dev key is set), without sending the key
  env: {
    LOGOS_ENABLED: String(Boolean(process.env.LOGO_DEV_TOKEN)),
  },
  // Planning docs served as pages; see src/app/plans
  outputFileTracingIncludes: {
    "/plans/*": ["docs/*.html"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
