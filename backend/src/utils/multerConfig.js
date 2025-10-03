const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if not exists
const ensureUploadsFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Storage factory function
const createStorage = (folder) => {
  ensureUploadsFolder(folder);
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(folder, 'original')); // always upload to original first
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });
};

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
  }
};

const createUploader = (folder, options = {}) => {
  ensureUploadsFolder(path.join(folder, 'original')); // ensure original folder exists
  const storage = createStorage(folder);
  return multer({
    storage,
    fileFilter: options.fileFilter || imageFileFilter,
    limits: options.limits || { fileSize: 5 * 1024 * 1024 }
  });
};

module.exports = {
  createUploader,
};
