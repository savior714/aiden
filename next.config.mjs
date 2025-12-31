/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { 
    unoptimized: true 
  },
  // Capacitor 호환성을 위한 trailing slash 설정
  trailingSlash: true,
};

export default nextConfig;
