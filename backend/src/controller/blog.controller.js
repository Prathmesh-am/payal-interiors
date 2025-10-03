const Blog = require('../model/blogModel');
const fs = require('fs').promises;
const { resizeAndSave } = require('../utils/imageResizer');
const path = require('path');
const { deleteOldBlogImages } = require('../utils/deleteImages');

const createBlog = async (req, res) => {
  try {
    const { title, slug, content, tags, categories, excerpt, status, publishedAt } = req.body;

    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) return res.status(400).json({ message: 'Slug already exists' });

    let featuredImage = null;
    console.log(req.files['featuredImage']);

    if (req.files['featuredImage']?.[0]) {
      const file = req.files['featuredImage'][0];
      const filePath = file.path;
      const filename = path.basename(filePath);
      const folder = path.resolve('uploads/blog');

      // ✅ create multiple sizes
      featuredImage = await resizeAndSave(filePath, filename, folder);
    }

    const blog = new Blog({
      title,
      slug,
      author: req.user._id,
      content,
      excerpt,
      tags: tags ? JSON.parse(tags) : [],
      categories: categories ? JSON.parse(categories) : [],
      featuredImage,
      status: status || 'draft',
      publishedAt: publishedAt || (status === 'published' ? new Date() : null),
    });

    await blog.save();
    const populatedBlog = await Blog.findById(blog._id).populate('author', 'name email');

    return res.status(201).json({ message: 'Blog created', blog: populatedBlog });
  } catch (error) {
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

      const newPaths = await resizeAndSave(file.path, filename, baseFolder);
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

    return res.json({ message: 'Blog and associated files deleted successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  createBlog,
  getBlogs,
  getBlogsBySlug,
  updateBlog,
  deleteBlog
};