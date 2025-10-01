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
    author: {  // reference to the designer (user)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {  
      type: String,
      required: true,
    },
    projectType: { // e.g., Residential, Commercial, Office, Kitchen
      type: String,
      required: true,
    },
    styles: [String], // e.g., Modern, Minimalist, Rustic
    rooms: [String],  // e.g., Living Room, Bedroom, Kitchen
    coverImage: {    
      type: String,
    },
    images: [String],
    clientName: {  
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
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
