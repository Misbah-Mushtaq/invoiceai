/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep @react-pdf/renderer out of the server (Node.js) bundle entirely.
  // It uses browser-only APIs; we always load it via dynamic() + ssr:false.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },

  webpack: (config, { isServer }) => {
    // `canvas` is an optional peer of @react-pdf/renderer used in Node
    // environments. We don't need it — marking it external prevents a
    // "Module not found: Can't resolve 'canvas'" build error.
    if (!isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        { canvas: "canvas" },
      ];
    }
    return config;
  },
};

export default nextConfig;
