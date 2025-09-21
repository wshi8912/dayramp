/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/pomodoro-timer',
        destination: '/focus-timer',
        permanent: true, // 301 redirect for SEO
      },
    ];
  },
};

module.exports = nextConfig;
