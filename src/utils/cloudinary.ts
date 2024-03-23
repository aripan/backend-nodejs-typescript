import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";

// Defining types for Cloudinary configuration parameters
type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

// Updating the configuration object type to CloudinaryConfig
const cloudinaryConfig: CloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
};

// Checking if configuration values are provided
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  throw new Error("Cloudinary configuration is missing");
}

// Initializing Cloudinary with configuration
cloudinary.config(cloudinaryConfig);

// Adjusting return type to Promise<UploadApiResponse | null>
const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    // Adding type annotation for response
    const response: UploadApiResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been successfully uploaded
    console.log("File is successfully uploaded on Cloudinary:", response.url);

    return response;
  } catch (error) {
    console.error("Error occurred while uploading:", error);

    //! Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Local temporary file removed:", localFilePath);
    }

    return null;
  }
};
