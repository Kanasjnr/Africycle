// import { CldUploadWidget } from "next-cloudinary";

// Validate environment variables with strict checks
const validateEnvVars = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Check for placeholder values
  if (cloudName === 'your-cloud-name' || !cloudName) {
    throw new Error('Invalid Cloudinary cloud name. Please check your .env.local file.');
  }

  if (uploadPreset === 'africycle-verification' || !uploadPreset) {
    throw new Error('Invalid Cloudinary upload preset. Please check your .env.local file.');
  }

  return { cloudName, uploadPreset };
};

// Export a function to get the config to ensure we always have the latest values
export const getCloudinaryConfig = () => {
  // Validate environment variables on each call
  const { cloudName, uploadPreset } = validateEnvVars();

  return {
    cloudName,
    uploadPreset,
  } as const;
};

// For backward compatibility, also export the static config
export const cloudinaryConfig = getCloudinaryConfig();

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  created_at: string;
}; 