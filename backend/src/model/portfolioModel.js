const mongoose = require('mongoose');

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
    featuredImage: {    // featured image
      type: String,
    },
    images: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        path: { type: String, required: true },
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
