// utils/imageResizer.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const resizeAndSave = async (filePath, filename, baseFolder) => {
  const sizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
  };

  const imagePaths = {
    original: `/uploads/blog/original/${filename}`,
  };

  // 🔑 important: run all sharp tasks in parallel
  await Promise.all(
    Object.entries(sizes).map(async ([key, width]) => {
      const outputDir = path.join(baseFolder, key);
      ensureDir(outputDir);

      const outputPath = path.join(outputDir, filename);

      await sharp(filePath)
        .resize({ width, withoutEnlargement: true }) // prevent enlarging
        .toFile(outputPath);

      imagePaths[key] = `/uploads/blog/${key}/${filename}`;
    })
  );

  return imagePaths;
};

module.exports = { resizeAndSave };
