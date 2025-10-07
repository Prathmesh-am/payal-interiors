const express = require('express');
const router = express.Router();
const { createUploader } = require('../utils/multerConfig');
const {uploadMedia, getAllMedia, getMediaById, updateMedia, deleteMedia} = require('../controller/media.controller');
const {isAuthenticated} = require('../middleware/passportConfig');
// Create uploader for media
const upload = createUploader('uploads/media');

// Routes
router.post('/upload', upload.single('file'), isAuthenticated, uploadMedia);
router.get('/', isAuthenticated, getAllMedia);
router.get('/:id', isAuthenticated, getMediaById);
router.put('/:id', isAuthenticated, updateMedia);
router.delete('/:id', isAuthenticated, deleteMedia);

module.exports = router;
