const Blog = require('../model/blogModel');
const fs = require('fs').promises;
const { resizeAndSave } = require('../utils/imageResizer');
const path = require('path');
const { deleteOldBlogImages } = require('../utils/deleteImages');

const createBlog = async (req, res) => {
  try {
    const { title, slug, content, tags, categories, excerpt, status, publishedAt } = req.body;

    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    let featuredImage = null;


    if (req.files['featuredImage']?.[0]) {
      const file = req.files['featuredImage'][0];
      const filename = path.basename(file.path);

      featuredImage = await resizeAndSave(file.path, filename, 'blog');
    }

    const blog = new Blog({
      title,
      slug,
      author: req.user._id,
      content,
      excerpt,
      tags: tags ? JSON.parse(tags) : [],
      categories: categories ? JSON.parse(categories) : [],
      featuredImage, // object with all paths
      status: status || 'draft',
      publishedAt: publishedAt || (status === 'published' ? new Date() : null),
    });

    await blog.save();

    const populatedBlog = await Blog.findById(blog._id).populate('author', 'name email');

    return res.status(201).json({
      message: 'Blog created',
      blog: populatedBlog,
    });
  } catch (error) {
    console.error('createBlog error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ message: "Blogs fetched successfully.", blogs: blogs });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const getBlogsBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name email');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized: Only admins can view draft/archived blogs' });
    }

    return res.json({ message: "Blogs fetched successfully", blog });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const updateBlog = async (req, res) => {
  try {
    const { title, slug, content, tags, categories, excerpt, status, publishedAt } = req.body;

    if (slug && slug !== req.params.slug) {
      const existing = await Blog.findOne({ slug });
      if (existing) return res.status(400).json({ message: 'Slug already exists' });
    }

    const updateData = {
      title,
      slug,
      content,
      excerpt,
      tags: tags ? JSON.parse(tags) : undefined,
      categories: categories ? JSON.parse(categories) : undefined,
      status,
      publishedAt: status === 'published' && !publishedAt ? new Date() : publishedAt,
    };

    const file = req.file || (req.files && req.files['featuredImage']?.[0]);
    if (file) {
      const filename = path.basename(file.path);
      const baseFolder = path.join(process.cwd(), 'uploads', 'blog');

      const oldBlog = await Blog.findOne({ slug: req.params.slug });
      if (oldBlog && oldBlog.featuredImage) {
        deleteOldBlogImages(oldBlog.featuredImage);
      }

      const newPaths = await resizeAndSave(file.path, filename, 'blog');
      updateData.featuredImage = newPaths; // store all paths
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!updatedBlog) return res.status(404).json({ message: 'Blog not found' });

    return res.json({ message: 'Blog updated', blog: updatedBlog });
  } catch (error) {
    console.error('updateBlog error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const filesToDelete = [];
    if (blog.featuredImage && typeof blog.featuredImage === 'object') {
      filesToDelete.push(...Object.values(blog.featuredImage));
    }

    if (filesToDelete.length > 0) {
      const results = await Promise.allSettled(
        filesToDelete.map(relativeUrlPath => {
          // 👇 Step 2: Construct the correct absolute path
       
          const absolutePath = path.join(process.cwd(), relativeUrlPath);
          return fs.unlink(absolutePath);
        })
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete file: ${filesToDelete[index]}`, result.reason);
        }
      });
    }

    await Blog.findByIdAndDelete(blog._id);

    return res.status(200).json({ message: 'Blog and associated images deleted successfully' });

  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogsBySlug,
  updateBlog,
  deleteBlog
};