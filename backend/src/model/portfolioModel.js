const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  original: String,
  thumbnail: String,
  small: String,
  medium: String,
  large: String
}, { _id: false });

const portfolioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: { 
      type: String,
      required: true,
      unique: true,
    },
    author: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

excerpt:{
    type: String, // short summary of the blog
  },
  content:{
     type: String,
     required: true,
  },
    projectType: { // e.g., Residential, Commercial, Office, Kitchen
      type: String,
      required: true,
    },
    featuredImage: imageSchema,
    images: [
      {
        title: { type: String,  },
        description: { type: String,  },
        path: imageSchema,
      },
    ],
    clientName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'scheduled'],
      default: 'draft',
    },
    projectDate: { 
      type: Date,
    },
    location: {      
      type: String,
    },
  },
  { timestamps: true } 
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
