import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.pointrapp.com",
                pathname: "/avatars/**",
            },
            {
                protocol: "https",
                hostname: "pointrapp-avatars.s3.us-east-1.amazonaws.com",
                pathname: "/avatars/**",
            }
        ],
        unoptimized: true,
    }
};

export default nextConfig;
