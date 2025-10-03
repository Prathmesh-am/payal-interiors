const fs = require('fs');
const path = require('path');

const deleteOldBlogImages = (featuredImage) => {
  if (!featuredImage) return;
  const baseFolder = path.join(process.cwd(), 'uploads', 'blog');
  const versions = Object.values(featuredImage); // [original, small, medium...]
  versions.forEach((url) => {
    if (!url) return;
    const filename = path.basename(url); // extract file
    const folders = ['original', 'thumbnail', 'small', 'medium', 'large'];
    folders.forEach((folder) => {
      const filePath = path.join(baseFolder, folder, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  });
};

module.exports = { deleteOldBlogImages };