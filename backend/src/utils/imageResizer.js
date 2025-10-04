// utils/imageResizer.js
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

/**
 * Resize and save images into multiple sizes
 * @param {string} filePath - path of uploaded file
 * @param {string} filename - name of the file
 * @param {string} folderName - "blog" | "portfolio" etc.
 */
const resizeAndSave = async (filePath, filename, folderName) => {
  if (!fs.existsSync(filePath)) throw new Error('Original file not found: ' + filePath);

  const baseFolder = path.join(process.cwd(), 'uploads', folderName);

  // Ensure size folders exist
  Object.keys(sizes).forEach((k) => ensureDir(path.join(baseFolder, k)));
  ensureDir(path.join(baseFolder, 'original'));

  const paths = {
    original: `/uploads/${folderName}/original/${filename}`
  };

  await Promise.all(
    Object.entries(sizes).map(async ([key, width]) => {
      const outPath = path.join(baseFolder, key, filename);
      await sharp(filePath).resize({ width, withoutEnlargement: true }).toFile(outPath);
      paths[key] = `/uploads/${folderName}/${key}/${filename}`;
    })
  );

  return paths;
};

module.exports = { resizeAndSave };
