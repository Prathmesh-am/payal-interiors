const express = require('express');
const router = express.Router();
const { createUploader } = require('../utils/multerConfig');
const checkAdmin = require('../middleware/checkRole');
const { isAuthenticated } = require('../middleware/passportConfig');
const { createPortfolio, getPortfolio, getPortfolioBySlug, updatePortfolio, deletePortfolio } = require('../controller/portfolio.controller');
const portfolioUploader = createUploader('uploads/portfolio');


router.post(
  '/',
  isAuthenticated,
  checkAdmin,
  portfolioUploader.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  createPortfolio
);

router.get('/', isAuthenticated, getPortfolio );

router.get('/:slug', isAuthenticated,getPortfolioBySlug );

router.put(
  '/:slug',
  isAuthenticated,
  checkAdmin,
  portfolioUploader.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
updatePortfolio
);


router.delete(
  '/:slug',
  isAuthenticated,
  checkAdmin,
  deletePortfolio
);

module.exports = router;


//create isAuth middleware to check if user is logged in and is admin.
