import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a base64 image to Cloudinary
export const uploadScreenshot = async (dataUrl, examId, type) => {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `proctoring/${examId}`,
    public_id: `${type}_${Date.now()}`,
    resource_type: 'image',
  });
  return result.secure_url;
};
