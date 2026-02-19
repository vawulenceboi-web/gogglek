const nextConfig = {
  // Disable webpack build worker to avoid crashes (SIGBUS) that produce incomplete builds on Vercel
  experimental: {
    webpackBuildWorker: false,
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

module.exports = nextConfig;