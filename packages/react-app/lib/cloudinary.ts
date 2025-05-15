// import { CldUploadWidget } from "next-cloudinary";

// Add debug logging
const debugEnv = () => {
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    hasCloudinaryUrl: !!process.env.CLOUDINARY_URL,
    // Log the full process.env to see what's available
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('CLOUDINARY'))
  });
};

// Call debug logging immediately
debugEnv();

// Validate environment variables with strict checks
const validateEnvVars = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Check for placeholder values
  if (cloudName === 'your-cloud-name' || !cloudName) {
    console.error('Invalid Cloudinary cloud name:', cloudName);
    throw new Error('Invalid Cloudinary cloud name. Please check your .env.local file.');
  }

  if (uploadPreset === 'africycle-verification' || !uploadPreset) {
    console.error('Invalid Cloudinary upload preset:', uploadPreset);
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