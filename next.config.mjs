/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reenvía /api al backend local para poder compartir el frontend por un túnel
  // (con NEXT_PUBLIC_API_URL=/ las llamadas salen al mismo origen del frontend).
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
