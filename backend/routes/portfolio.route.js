const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const passport = require('passport');
const Portfolio = require('./../model/portfolioModel'); // Make sure the path is correct
const { createUploader } = require('../utils/multerConfig'); // Make sure the path is correct

// Create an uploader instance specifically for portfolio images
const portfolioUploader = createUploader('uploads/portfolios');

// Middleware to check if the authenticated user is an admin
const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Admin access required' });
  }
  next();
};

// --------------------- CREATE PORTFOLIO PROJECT ---------------------
router.post(
  '/create',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  portfolioUploader.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }, // Allow more images for a portfolio
  ]),
  async (req, res) => {
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

      // Check if the slug is unique
      const existingPortfolio = await Portfolio.findOne({ slug });
      if (existingPortfolio) {
        return res.status(400).json({ message: 'This slug is already in use.' });
      }

      // Get file paths from multer
      const coverImage = req.files['coverImage']?.[0].path;
      const images = req.files['images']?.map(file => file.path) || [];

      const portfolio = new Portfolio({
        title,
        slug,
        author: req.user._id, // Assign the logged-in admin/user as the author
        description,
        projectType,
        styles: styles ? JSON.parse(styles) : [], // Expecting a JSON string array
        rooms: rooms ? JSON.parse(rooms) : [],   // Expecting a JSON string array
        clientName,
        status: status || 'draft',
        projectDate,
        location,
        coverImage,
        images,
      });

      await portfolio.save();
      
      // Populate author details before sending the response
      const populatedPortfolio = await Portfolio.findById(portfolio._id).populate('author', 'name email');
      
      res.status(201).json({ message: 'Portfolio project created successfully', portfolio: populatedPortfolio });

    } catch (error) {
      res.status(500).json({ message: 'An error occurred on the server', error: error.message });
    }
  }
);

// --------------------- GET ALL PUBLISHED PORTFOLIO PROJECTS ---------------------
router.get('/getportfolios', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ status: 'published' })
      .populate('author', 'name email') // Show author's name and email
      .sort({ projectDate: -1 }); // Sort by newest project date
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred on the server', error: error.message });
  }
});

// --------------------- GET A SINGLE PORTFOLIO PROJECT BY SLUG ---------------------
router.get('/:slug', async (req, res) => {
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

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred on the server', error: error.message });
  }
});

// --------------------- UPDATE PORTFOLIO PROJECT ---------------------
router.put(
  '/:slug',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  portfolioUploader.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  async (req, res) => {
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

      // If slug is being changed, check if the new one is unique
      if (slug && slug !== req.params.slug) {
        const existingPortfolio = await Portfolio.findOne({ slug });
        if (existingPortfolio) {
          return res.status(400).json({ message: 'This slug is already in use.' });
        }
      }
      
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

      // Check for and add new file paths if they were uploaded
      if (req.files['coverImage']) {
        updateData.coverImage = req.files['coverImage'][0].path;
      }
      if (req.files['images']) {
        updateData.images = req.files['images'].map(file => file.path);
      }

      // Remove any fields that were not provided in the request
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      const updatedPortfolio = await Portfolio.findOneAndUpdate(
        { slug: req.params.slug },
        { $set: updateData },
        { new: true, runValidators: true } // Return the updated document
      ).populate('author', 'name email');

      if (!updatedPortfolio) {
        return res.status(404).json({ message: 'Portfolio project not found' });
      }

      res.json({ message: 'Portfolio project updated successfully', portfolio: updatedPortfolio });

    } catch (error) {
      res.status(500).json({ message: 'An error occurred on the server', error: error.message });
    }
  }
);

// --------------------- DELETE PORTFOLIO PROJECT ---------------------
router.delete(
  '/:slug',
  passport.authenticate('jwt', { session: false }),
  checkAdmin,
  async (req, res) => {
    try {
      // Step 1: Find the document first to get the file paths
      const portfolio = await Portfolio.findOne({ slug: req.params.slug });
      
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio project not found' });
      }
      
      // Step 2: Gather all file paths into a single array
      const filesToDelete = [];
      if (portfolio.coverImage) {
        filesToDelete.push(portfolio.coverImage);
      }
      if (portfolio.images && portfolio.images.length > 0) {
        filesToDelete.push(...portfolio.images);
      }

      // Step 3: Attempt to delete the files from the filesystem
      if (filesToDelete.length > 0) {
        // Promise.allSettled allows us to attempt all deletions, even if some fail
        await Promise.allSettled(
          filesToDelete.map(filePath => fs.unlink(filePath))
        ).then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              // Log an error if a file couldn't be deleted (e.g., it doesn't exist)
              console.error(`Failed to delete file: ${filesToDelete[index]}`, result.reason);
            }
          });
        });
      }

      // Step 4: Delete the document from the database
      await Portfolio.findByIdAndDelete(portfolio._id);

      res.json({ message: 'Portfolio project and associated files deleted successfully' });
      
    } catch (error) {
      res.status(500).json({ message: 'An error occurred on the server', error: error.message });
    }
  }
);

module.exports = router;