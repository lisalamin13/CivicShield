const fs = require('node:fs/promises');
const path = require('node:path');

const { v2: cloudinary } = require('cloudinary');

const uploadDir = path.join(__dirname, '..', 'uploads');

const hasCloudinaryConfig = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = async (buffer, filename, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `${folder}/${filename}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          provider: 'cloudinary',
          path: result.public_id,
          url: result.secure_url,
        });
      },
    );

    stream.end(buffer);
  });

const uploadLocally = async (buffer, filename, folder) => {
  const fullFolderPath = path.join(uploadDir, folder);
  await fs.mkdir(fullFolderPath, { recursive: true });
  const fullPath = path.join(fullFolderPath, filename);
  await fs.writeFile(fullPath, buffer);

  return {
    provider: 'local',
    path: fullPath,
    url: `/uploads/${folder}/${filename}`,
  };
};

const uploadBuffer = async ({ buffer, filename, folder }) => {
  if (hasCloudinaryConfig()) {
    return uploadToCloudinary(buffer, filename, folder);
  }

  return uploadLocally(buffer, filename, folder);
};

module.exports = {
  uploadBuffer,
};
