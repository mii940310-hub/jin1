/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'shoongfarm.co.kr' }],
        destination: 'https://www.shoongfarm.co.kr/:path*',
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
