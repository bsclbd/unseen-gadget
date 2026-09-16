import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

export interface UploadResult {
  url: string;
  publicId: string | null;
}

// Fallback verified credentials for production reliability
const FALLBACK_CLOUDINARY = {
  cloud_name: "lndolcud",
  api_key: "633857785273237",
  api_secret: "qr7RiMlfJkREoxG_rH1IWrmWwCs",
};

function cleanEnv(val?: string | null): string {
  if (!val) return "";
  return String(val).replace(/^["']|["']$/g, "").trim();
}

function getCloudinaryCredentials() {
  const cloudName = cleanEnv(env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(env.CLOUDINARY_API_SECRET);

  const isPlaceholder =
    !cloudName ||
    cloudName.includes("your-cloudinary") ||
    cloudName === "changeme" ||
    cloudName.length < 3;

  if (isPlaceholder) {
    return FALLBACK_CLOUDINARY;
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey || FALLBACK_CLOUDINARY.api_key,
    api_secret: apiSecret || FALLBACK_CLOUDINARY.api_secret,
  };
}

function getBaseUrl(): string {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  const configured = cleanEnv(env.API_URL);
  if (configured && !configured.includes("localhost:5000")) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://unseen-gadgetbackend-production.up.railway.app";
  }
  return configured || "http://localhost:5000";
}

export async function uploadImage(
  buffer: Buffer,
  originalname: string,
): Promise<UploadResult> {
  const creds = getCloudinaryCredentials();

  try {
    cloudinary.config({
      cloud_name: creds.cloud_name,
      api_key: creds.api_key,
      api_secret: creds.api_secret,
    });

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "unseen-gadget/products", resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Upload failed"));
              return;
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );
        stream.end(buffer);
      },
    );

    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to local file storage:", error);
  }

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = getBaseUrl();
  return { url: `${baseUrl}/uploads/${filename}`, publicId: null };
}

export const UploadService = { uploadImage };

export default UploadService;