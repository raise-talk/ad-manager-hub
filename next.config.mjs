/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["marvellous-tenesha-noncaptious.ngrok-free.dev"],
    },
  },
};

export default nextConfig;
