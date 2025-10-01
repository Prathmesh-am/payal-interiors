const fs = require('fs').promises;
const express = require('express');
const router = express.Router();
const passport = require('passport');
const Blog = require('./../model/blogModel');
const { createUploader } = require('../utils/multerConfig');

// Create uploader for blogs
const blogUploader = createUploader('uploads/blogs');

// Admin check middleware
const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Admin access required' });
  }
  next();
};

router.post(
  '/create',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  blogUploader.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { title, slug, content, tags, categories, status } = req.body;

      // Check unique slug
      const existingBlog = await Blog.findOne({ slug });
      if (existingBlog) return res.status(400).json({ message: 'Slug already exists' });

      const coverImage = req.files['coverImage']?.[0].path;
      const images = req.files['images']?.map(file => file.path) || [];

      const blog = new Blog({
        title,
        slug,
        author: req.user._id,
        content,
        tags: tags ? JSON.parse(tags) : [],
        categories: categories ? JSON.parse(categories) : [],
        coverImage,
        images,
        status: status || 'draft',
      });

      await blog.save();
      const populatedBlog = await Blog.findById(blog._id).populate('author', 'name email');
      res.status(201).json({ message: 'Blog created', blog: populatedBlog });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.get('/getblogs',   passport.authenticate('jwt', { session: false }),async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:slug',  passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name email');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized: Only admins can view draft/archived blogs' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put(
  '/:slug',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  blogUploader.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { title, slug, content, tags, categories, status } = req.body;

      // Check new slug uniqueness
      if (slug && slug !== req.params.slug) {
        const existingBlog = await Blog.findOne({ slug });
        if (existingBlog) return res.status(400).json({ message: 'Slug already exists' });
      }

      const coverImage = req.files['coverImage']?.[0].path;
      const images = req.files['images']?.map(file => file.path);

      const updateData = {
        title,
        slug,
        content,
        tags: tags ? JSON.parse(tags) : undefined,
        categories: categories ? JSON.parse(categories) : undefined,
        coverImage,
        images,
        status,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      const updatedBlog = await Blog.findOneAndUpdate(
        { slug: req.params.slug },
        updateData,
        { new: true, runValidators: true }
      ).populate('author', 'name email');

      if (!updatedBlog) return res.status(404).json({ message: 'Blog not found' });

      res.json({ message: 'Blog updated', blog: updatedBlog });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.delete(
  '/:slug',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  async (req, res) => {
    try {
      // Step 1: Find the blog post to get its file paths before deleting
      const blog = await Blog.findOne({ slug: req.params.slug });

      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Step 2: Collect the paths of the cover image and any other images
      const filesToDelete = [];
      if (blog.coverImage) {
        filesToDelete.push(blog.coverImage);
      }
      if (blog.images && blog.images.length > 0) {
        filesToDelete.push(...blog.images);
      }

      // Step 3: Delete the collected files from the server's filesystem
      if (filesToDelete.length > 0) {
        await Promise.allSettled(
          filesToDelete.map(filePath => fs.unlink(filePath))
        ).then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              // This is useful for debugging if a file doesn't exist but the DB record does
              console.error(`Failed to delete file: ${filesToDelete[index]}`, result.reason);
            }
          });
        });
      }

      // Step 4: Now, delete the blog post from the database
      await Blog.findByIdAndDelete(blog._id);

      res.json({ message: 'Blog and associated files deleted successfully' });
      
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
