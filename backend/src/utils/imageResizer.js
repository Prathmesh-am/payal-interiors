const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const sizes = {
  thumbnail: 64,
  small: 256,
  medium: 512,
  large: 1024
};

const resizeAndSave = async (filePath, filename) => {
  if (!fs.existsSync(filePath)) throw new Error('Original file not found: ' + filePath);

  const baseUploadsDir = path.join(process.cwd(), 'uploads');
  const baseFolder = path.join(baseUploadsDir, 'media'); // 'uploads/media'

  // 🔑 Ensure the base 'uploads/media' directory exists
  ensureDir(baseFolder);

  // Ensure size folders exist
  Object.keys(sizes).forEach((k) => ensureDir(path.join(baseFolder, k)));
  const originalDir = path.join(baseFolder, 'original');
  ensureDir(originalDir);

  const paths = {
    original: `/uploads/media/original/${filename}`
  };

  // 1. Move the temporary uploaded file to the final 'original' location
  const finalOriginalPath = path.join(originalDir, filename);
  // Check if the file is already in the final path (e.g., if using a custom multer storage)
  if (filePath !== finalOriginalPath) {
    fs.renameSync(filePath, finalOriginalPath);
    filePath = finalOriginalPath; // Update filePath for resizing
  }

  // 2. Resize and save versions
  await Promise.all(
    Object.entries(sizes).map(async ([key, width]) => {
      const outPath = path.join(baseFolder, key, filename);
      // Use the final original path for sharp
      await sharp(filePath).resize({ width, withoutEnlargement: true }).toFile(outPath);
      paths[key] = `/uploads/media/${key}/${filename}`;
    })
  );

  return paths;
};

module.exports = { resizeAndSave };