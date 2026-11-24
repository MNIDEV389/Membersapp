// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose env var to client
  env: {
    NEXT_PUBLIC_ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH || 'true',
  },
  // Additional Next.js config if needed
  reactStrictMode: true,
};

module.exports = nextConfig;
