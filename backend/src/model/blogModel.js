const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
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
  content: {           
    type: String,
    required: true,
  },

  tags: [String],            
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],    
  featuredImage: {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    versions: {
      original: String,
      thumbnail: String,
      small: String,
      medium: String,
      large: String
    }
  },
  status: {               
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft',
  },
  publishedAt: { type: Date },
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;