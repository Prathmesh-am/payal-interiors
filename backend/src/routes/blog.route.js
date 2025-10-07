const fs = require('fs').promises;
const express = require('express');
const router = express.Router();

const checkAdmin = require('../middleware/checkRole');
const { isAuthenticated } = require('../middleware/passportConfig');
const { createBlog, getBlogs, getBlogsBySlug, updateBlog, deleteBlog } = require('../controller/blog.controller');

router.post(
  '/',
  isAuthenticated,
  checkAdmin,
  createBlog
);

router.get('/', isAuthenticated,getBlogs);

router.get('/:slug', isAuthenticated, getBlogsBySlug);

router.put(
  '/:slug',
  isAuthenticated,
  checkAdmin,
 updateBlog
);

router.delete(
  '/:slug',
  isAuthenticated,
  checkAdmin,
 deleteBlog
);

module.exports = router;
