import type { NextConfig } from "next";

interface RemotePattern {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
  search?: string;
}

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
  },
];

function addStorageRemotePatterns() {
  if (process.env.STORAGE_DRIVER !== "s3") return;

  const publicUrl = process.env.STORAGE_PUBLIC_URL;
  const endpoint = process.env.STORAGE_S3_ENDPOINT;
  const target = publicUrl || endpoint;

  if (!target) return;

  try {
    const url = new URL(target);
    const pathname = url.pathname === "/" ? "/**" : `${url.pathname}/**`;
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname,
    });
  } catch {
    // ignore invalid URLs
  }
}

addStorageRemotePatterns();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns,
  },
};

export default nextConfig;
