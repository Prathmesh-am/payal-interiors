const fs = require('fs').promises;
const express = require('express');
const router = express.Router();

const { createUploader } = require('../utils/multerConfig');
const checkAdmin = require('../middleware/checkRole');
const { isAuthenticated } = require('../middleware/passportConfig');
const { createBlog, getBlogs, getBlogsBySlug, updateBlog, deleteBlog } = require('../controller/blog.controller');

// Create uploader for blogs
const blogUploader = createUploader('uploads/blog');

router.post(
  '/',
  isAuthenticated,
  checkAdmin,
  blogUploader.fields([
    { name: 'featuredImage', maxCount: 1 },
  ]),
  createBlog
);

router.get('/', isAuthenticated,getBlogs);

router.get('/:slug', isAuthenticated, getBlogsBySlug);

router.put(
  '/:slug',
  isAuthenticated,
  checkAdmin,
  blogUploader.fields([
    { name: 'featuredImage', maxCount: 1 },
  ]),
 updateBlog
);

router.delete(
  '/:slug',
  isAuthenticated,
  checkAdmin,
 deleteBlog
);

module.exports = router;
