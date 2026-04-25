const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "chai-cedar-platform";

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: isGithubPages ? `/${repoName}` : undefined,
  basePath: isGithubPages ? `/${repoName}` : undefined,
  images: {
    unoptimized: true
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true
};

export default nextConfig;
