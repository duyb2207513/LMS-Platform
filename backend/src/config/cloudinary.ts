import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "./env.js";
import { logger } from "./logger.js";

if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
  logger.info({ cloudName: env.cloudinaryCloudName }, "Cloudinary configured successfully");
} else {
  logger.warn("Cloudinary credentials not fully configured; fallback storage mode active");
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinaryCloudName &&
    env.cloudinaryApiKey &&
    env.cloudinaryApiSecret
  );
}

export interface CloudinaryUploadOptions {
  folder: string;
  filename?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      resource_type: options.resourceType ?? "auto",
      public_id: options.filename,
      use_filename: true,
      unique_filename: true,
      overwrite: true
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned undefined result"));
          return;
        }
        resolve(result);
      }
    );

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

export async function uploadFileToCloudinary(
  filePath: string,
  options: CloudinaryUploadOptions
): Promise<UploadApiResponse> {
  const uploadOptions: UploadApiOptions = {
    folder: options.folder,
    resource_type: options.resourceType ?? "auto",
    public_id: options.filename,
    use_filename: true,
    unique_filename: true,
    overwrite: true
  };

  return cloudinary.uploader.upload(filePath, uploadOptions);
}

export async function deleteFromCloudinary(
  urlOrPublicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId.startsWith("http://") || urlOrPublicId.startsWith("https://")) {
      if (!urlOrPublicId.includes("cloudinary.com")) {
        return;
      }
      const parts = urlOrPublicId.split("/upload/");
      if (parts.length === 2) {
        const afterUpload = parts[1];
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf(".")) || withoutVersion;
      }
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.warn({ err: error, target: urlOrPublicId }, "Failed to delete resource from Cloudinary");
  }
}
