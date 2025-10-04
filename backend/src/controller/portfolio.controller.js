const Portfolio = require('./../model/portfolioModel');
const fs = require('fs').promises;
const { resizeAndSave } = require('../utils/imageResizer');
const path = require('path');

const createPortfolio = async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      projectType,
      excerpt,
      clientName,
      status,
      projectDate,
      location,
    } = req.body;

    
    const existingPortfolio = await Portfolio.findOne({ slug });
    if (existingPortfolio) {
      return res.status(400).json({ message: 'This slug is already in use.' });
    }

    let featuredImage = null;
    let images = [];

    
    if (req.files['featuredImage']?.[0]) {
      const file = req.files['featuredImage'][0];
      const filename = path.basename(file.path);
      featuredImage = await resizeAndSave(file.path, filename, 'portfolio');
    }

  
    const galleryFiles = req.files['images'] || [];
    for (const file of galleryFiles) {
      const filename = path.basename(file.path);
      const optimizedPaths = await resizeAndSave(file.path, filename, 'portfolio');

      const imageData = {
        title: file.originalname, // can be overridden by frontend field
        description: 'this is description',          // can be filled by frontend
        path: optimizedPaths,
      };

      images.push(imageData);
    }

    const portfolio = new Portfolio({
      title,
      slug,
      author: req.user._id,
      content,
      excerpt,
      projectType,
      featuredImage,
      images,
      clientName,
      status: status || 'draft',
      projectDate,
      location,
    });

    await portfolio.save();

    const populatedPortfolio = await Portfolio.findById(portfolio._id)
      .populate('author', 'name email');

    return res.status(201).json({
      message: 'Portfolio project created successfully',
      portfolio: populatedPortfolio,
    });

  } catch (error) {
    console.error('createPortfolio error:', error);
    return res.status(500).json({
      message: 'An error occurred on the server',
      error: error.message,
    });
  }
};

const getPortfolio = async (req, res) => {
     try {
          const portfolios = await Portfolio.find({ status: 'published' })
               .populate('author', 'name email') // Show author's name and email
               .sort({ projectDate: -1 }); // Sort by newest project date
          return res.json({ message: "Portfolio fetched successfully.", portfolio: portfolios });
     } catch (error) {
          return res.status(500).json({ message: 'An error occurred on the server', error: error.message });
     }
}

const getPortfolioBySlug = async (req, res) => {
     try {
          const portfolio = await Portfolio.findOne({ slug: req.params.slug }).populate('author', 'name email');

          if (!portfolio) {
               return res.status(404).json({ message: 'Portfolio project not found' });
          }

          // Allow public access only to 'published' projects
          // Admins can view projects with any status
          if (portfolio.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
               return res.status(403).json({ message: 'You are not authorized to view this content' });
          }

          return res.json({ message: "Portfolio fetched successfully.", portfolio: portfolio });
     } catch (error) {
          return res.status(500).json({ message: 'An error occurred on the server', error: error.message });
     }
}

const updatePortfolio = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      projectType,
      styles,
      rooms,
      clientName,
      status,
      projectDate,
      location,
    } = req.body;

    // Find the existing portfolio
    const existingPortfolio = await Portfolio.findOne({ slug: req.params.slug });
    if (!existingPortfolio) {
      return res.status(404).json({ message: 'Portfolio project not found' });
    }

    // If slug is being changed, check if the new one is unique
    if (slug && slug !== req.params.slug) {
      const slugExists = await Portfolio.findOne({ slug });
      if (slugExists) {
        return res.status(400).json({ message: 'This slug is already in use.' });
      }
    }

    // Convert to plain object
    const portfolioData = existingPortfolio.toObject();
    const filesToDelete = [];

    // Collect old image paths to delete
    if (req.files['featuredImage'] && portfolioData.featuredImage && typeof portfolioData.featuredImage === 'object') {
      Object.values(portfolioData.featuredImage).forEach(value => {
        if (typeof value === 'string' && value.trim() !== '') {
          filesToDelete.push(value);
        }
      });
    }

    if (req.files['images'] && portfolioData.images && Array.isArray(portfolioData.images)) {
      portfolioData.images.forEach(image => {
        if (image.path && typeof image.path === 'object') {
          Object.values(image.path).forEach(value => {
            if (typeof value === 'string' && value.trim() !== '') {
              filesToDelete.push(value);
            }
          });
        }
      });
    }

    // Delete old files
    if (filesToDelete.length > 0) {
      const baseDir = path.join(process.cwd());
      const results = await Promise.allSettled(
        filesToDelete.map(async (relativeUrlPath) => {
          if (typeof relativeUrlPath !== 'string') {
            throw new Error(`Invalid path detected: ${relativeUrlPath}`);
          }
          const cleanPath = relativeUrlPath.startsWith('/') ? relativeUrlPath.slice(1) : relativeUrlPath;
          const absolutePath = path.join(baseDir, cleanPath);
          await fs.access(absolutePath);
          await fs.unlink(absolutePath);
        })
      );

      const failedDeletions = results.filter(result => result.status === 'rejected');
      if (failedDeletions.length > 0) {
        console.error('Some files failed to delete:', failedDeletions.map((r, i) => ({
          file: filesToDelete[i],
          error: r.reason.message,
        })));
        return res.status(500).json({
          message: 'Portfolio update failed due to file deletion errors',
          errors: failedDeletions.map((r, i) => ({
            file: filesToDelete[i],
            error: r.reason.message,
          })),
        });
      }
    }

    // Prepare update data
    const updateData = {
      title,
      slug,
      description,
      projectType,
      styles: styles ? JSON.parse(styles) : undefined,
      rooms: rooms ? JSON.parse(rooms) : undefined,
      clientName,
      status,
      projectDate,
      location,
    };

    // Process new featuredImage
    if (req.files['featuredImage']) {
      const originalPath = req.files['featuredImage'][0].path;
      const fileName = path.basename(originalPath);
      updateData.featuredImage = await resizeAndSave(
        path.join(process.cwd(), originalPath.startsWith('/') ? originalPath.slice(1) : originalPath),
        fileName,
        'portfolio'
      );
    }

    // Process new images
    if (req.files['images']) {
      updateData.images = await Promise.all(
        req.files['images'].map(async file => {
          const originalPath = file.path;
          const fileName = path.basename(originalPath);
          const resizedPaths = await resizeAndSave(
            path.join(process.cwd(), originalPath.startsWith('/') ? originalPath.slice(1) : originalPath),
            fileName,
            'portfolio'
          );
          return {
            title: file.originalname,
            description: '', // Adjust if descriptions are provided
            path: resizedPaths,
          };
        })
      );
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Update the portfolio
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio project not found' });
    }

    return res.json({ message: 'Portfolio project updated successfully', portfolio: updatedPortfolio });

  } catch (error) {
    console.error('Error updating portfolio:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ slug: req.params.slug });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio project not found' });
    }

    const portfolioData = portfolio.toObject();
    const filesToDelete = [];

    // Process featuredImage paths
    if (portfolioData.featuredImage && typeof portfolioData.featuredImage === 'object' && portfolioData.featuredImage !== null) {
      Object.values(portfolioData.featuredImage).forEach(value => {
        if (typeof value === 'string' && value.trim() !== '') {
          filesToDelete.push(value);
        }
      });
    }

    // Process images array paths
    if (portfolioData.images && Array.isArray(portfolioData.images)) {
      portfolioData.images.forEach(image => {
        if (image.path && typeof image.path === 'object' && image.path !== null) {
          Object.values(image.path).forEach(value => {
            if (typeof value === 'string' && value.trim() !== '') {
              filesToDelete.push(value);
            }
          });
        }
      });
    }

    // Delete files if any exist
    if (filesToDelete.length > 0) {
      const baseDir = path.join(process.cwd());
      const results = await Promise.allSettled(
        filesToDelete.map(async (relativeUrlPath) => {
          if (typeof relativeUrlPath !== 'string') {
            throw new Error(`Invalid path detected: ${relativeUrlPath}`);
          }
          const cleanPath = relativeUrlPath.startsWith('/') ? relativeUrlPath.slice(1) : relativeUrlPath;
          const absolutePath = path.join(baseDir, cleanPath);
          await fs.access(absolutePath);
          await fs.unlink(absolutePath);
        })
      );

      const failedDeletions = results.filter(result => result.status === 'rejected');
      if (failedDeletions.length > 0) {
        console.error('Some files failed to delete:', failedDeletions.map((r, i) => ({
          file: filesToDelete[i],
          error: r.reason.message,
        })));
        return res.status(500).json({
          message: 'Portfolio deleted, but some files could not be deleted',
          errors: failedDeletions.map((r, i) => ({
            file: filesToDelete[i],
            error: r.reason.message,
          })),
        });
      }
    }

    // Delete the database document
    await Portfolio.findByIdAndDelete(portfolio._id);

    return res.status(200).json({ message: 'Portfolio project and associated images deleted successfully' });

  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
     createPortfolio,
     getPortfolio,
     getPortfolioBySlug,
     updatePortfolio,
     deletePortfolio
};