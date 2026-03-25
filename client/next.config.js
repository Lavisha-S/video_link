/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    next_public_server_url: process.env.next_public_server_url || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
