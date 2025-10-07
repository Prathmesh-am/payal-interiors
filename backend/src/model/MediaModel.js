const { text } = require('express');
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },        // main stored file name
    versions: {
      original: { type: String, required: true },    
      thumbnail: { type: String },                    
      small: { type: String },
      medium: { type: String },
      large: { type: String },
    },
    altText: { type: String },
    description: { type: String },
    title: { type: String },
    type: { type: String, required: true },            // image, video, document, etc.
    mimeType: { type: String },                        // e.g. image/jpeg
    tags: [{ type: String }],

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
const Media = mongoose.model('Media', mediaSchema);
module.exports = Media;
