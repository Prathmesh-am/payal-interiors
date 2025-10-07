const Blog = require('../model/blogModel');
const fs = require('fs').promises;
const { resizeAndSave } = require('../utils/imageResizer');
const path = require('path');
const slugify = require('slugify');
 const createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      tags,
      categories,
      status,
      featuredImage,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // 1️⃣ Generate a unique slug from the title
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await Blog.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // 2️⃣ Handle featured image if provided
    let featuredImageObj = null;
    if (featuredImage && typeof featuredImage === "object") {
      if (featuredImage.mediaId && featuredImage.versions) {
        featuredImageObj = {
          mediaId: featuredImage.mediaId,
          versions: featuredImage.versions,
        };
      } else {
        // For compatibility — if frontend only sends URL or string
        featuredImageObj = featuredImage;
      }
    }

    // 3️⃣ Create a new blog document
    const blog = new Blog({
      title,
      slug,
      author: req.user?._id, 
      content,
      excerpt: excerpt || content.replace(/<[^>]+>/g, "").slice(0, 150),
      tags: Array.isArray(tags) ? tags : [],
      categories: Array.isArray(categories) ? categories : [],
      featuredImage: featuredImageObj,
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
    });

    await blog.save();

    // 4️⃣ Populate author details for frontend
    const populatedBlog = await Blog.findById(blog._id).populate(
      "author",
      "name email"
    );

    return res.status(201).json({
      message: "Blog created successfully",
      blog: populatedBlog,
    });
  } catch (error) {
    console.error("createBlog error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const skip = (page - 1) * limit;

    const totalBlogs = await Blog.countDocuments({ status: 'published' });
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name email')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalBlogs / limit);

    return res.json({
      message: "Blogs fetched successfully.",
      blogs: blogs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalBlogs,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBlogsBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name email') .populate('categories', 'name');
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
    const {
      title,
      slug,
      content,
      tags,
      categories,
      excerpt,
      status,
      publishedAt,
      featuredImage // expected: { mediaId, versions }
    } = req.body;

    // 1. Check for slug change
    if (slug && slug !== req.params.slug) {
      const existing = await Blog.findOne({ slug });
      if (existing) return res.status(400).json({ message: 'Slug already exists' });
    }

    // 2. Prepare update data
    const updateData = {
      title,
      slug,
      content,
      excerpt,
      tags: tags ? JSON.parse(tags) : undefined,
      categories: categories ? JSON.parse(categories) : undefined,
      status,
      publishedAt: status === 'published' && !publishedAt ? new Date() : publishedAt
    };

    // 3. Handle featured image from Media Library
    if (featuredImage && featuredImage.mediaId && featuredImage.versions) {
      updateData.featuredImage = {
        mediaId: featuredImage.mediaId,
        versions: featuredImage.versions
      };
    }

    // 4. Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // 5. Update blog
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
        // 1. Find the blog by slug to get its _id
        const blog = await Blog.findOne({ slug: req.params.slug });

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // 2. Delete the blog record from the database by its ID
        await Blog.findByIdAndDelete(blog._id);

        // 3. Send success response
        return res.status(200).json({ message: 'Blog deleted successfully' });

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