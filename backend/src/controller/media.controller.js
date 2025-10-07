const Media = require('../model/MediaModel');
const path = require('path');
const fs = require('fs');
const { resizeAndSave } = require('../utils/imageResizer');


const uploadMedia = async (req, res) => {
  try {
    if (!req.file) 
      return res.status(400).json({ message: "No file uploaded" });

    const { tags, title, description, altText } = req.body;
    const folderName = "media"; 

    // Define folder path
    const folderPath = path.join(process.cwd(), folderName);

    // ✅ Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = req.file.filename;
    const filePath = req.file.path;

    // Resize and store versions
    const versions = await resizeAndSave(filePath, filename, folderName);

    // Save to DB
    const media = await Media.create({
      filename,
      versions,
      type: "image",
      mimeType: req.file.mimetype,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      uploadedBy: req.user?._id || null,
      title,
      description,
      altText
    });

    return res.status(201).json(media);
  } catch (error) {
    console.error("Error uploading media:", error);
    return res.status(500).json({ message: "Failed to upload media", error: error.message });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const { tag, type, search } = req.query;
    const query = {};

    if (tag) query.tags = tag;
    if (type) query.type = type;
    if (search) query.filename = { $regex: search, $options: 'i' };

    const media = await Media.find(query).sort({ createdAt: -1 });
    return res.json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch media', error: error.message });
  }
};

const getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media not found' });
    return res.json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get media', error: error.message });
  }
};

const updateMedia = async (req, res) => {
  try {
    const updates = req.body;
    const media = await Media.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!media) return res.status(404).json({ message: 'Media not found' });
    return res.json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update media', error: error.message });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    // Remove all versions from disk
    Object.values(media.versions || {}).forEach((url) => {
      const localPath = path.join(process.cwd(), url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    });

    await media.deleteOne();
    return res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete media', error: error.message });
  }
};

module.exports = {
  uploadMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
};
