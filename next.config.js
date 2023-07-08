/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  assetPrefix: "",
  images: { unoptimized: true }
  
}

//module.exports = nextConfig
/** 
const path = require('path');
const nextPagesDir = path.join(__dirname, 'pages');

const typescriptLoader = {
  test: /\.ts(x?)$/,
  loader: ['ts-loader'],
  exclude: /node_modules/,
  include: [
    nextPagesDir
  ]
};

nextConfig.webpack = (config) => {
  config.module.rules = config.module.rules.concat(typescriptLoader)
  return config;
}*/

module.exports = nextConfig
