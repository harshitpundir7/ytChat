import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "@huggingface/transformers",
    "@xenova/transformers",
    "onnxruntime-node",
  ],
};

export default nextConfig;
