import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import mdx from "@next/mdx";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withMDX = mdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  transpilePackages: ["cos-js-sdk-v5"],
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
    mdxRs: true,
  },
  async headers() {
    return [
      {
        source: "/baidu_verify_:path*.html",
        headers: [
          {
            key: "Content-Type",
            value: "text/html; charset=utf-8",
          },
        ],
      },
      {
        source: "/yandex_:path*.html",
        headers: [
          {
            key: "Content-Type",
            value: "text/html; charset=UTF-8",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
};

// 应用所有插件
const configWithPlugins = withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));

// 创建新对象，确保删除 experimental.runtime
const finalConfig = {
  ...configWithPlugins,
  experimental: configWithPlugins.experimental
    ? Object.fromEntries(
        Object.entries(configWithPlugins.experimental).filter(
          ([key]) => key !== "runtime"
        )
      )
    : undefined,
};

// 恢复 headers 和 redirects 函数
if (configWithPlugins.headers) {
  finalConfig.headers = configWithPlugins.headers;
}
if (configWithPlugins.redirects) {
  finalConfig.redirects = configWithPlugins.redirects;
}

export default finalConfig;
