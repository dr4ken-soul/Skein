/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { "@coinbase/cdp-sdk": "commonjs @coinbase/cdp-sdk", "@x402/evm": "commonjs @x402/evm", "@x402/core": "commonjs @x402/core", "@x402/svm": "commonjs @x402/svm" }];
    return config;
  },
};
export default nextConfig;
