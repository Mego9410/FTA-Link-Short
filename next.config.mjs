/** @type {import('next').NextConfig} */
const nextConfig = {
  // The home directory contains other lockfiles/configs; pin tracing to this app.
  outputFileTracingRoot: import.meta.dirname,
  // A broken ESLint config exists higher up the tree; lint locally with `npm run lint`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
