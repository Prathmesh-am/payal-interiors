const express = require('express');
const router = express.Router();
const checkAdmin = require('../middleware/checkRole');
const { isAuthenticated } = require('../middleware/passportConfig');
const { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } = require('../controller/blogCategory.controller');

router.post('/', isAuthenticated, checkAdmin, createCategory);
router.get('/', isAuthenticated, getCategories);
router.get('/:id', isAuthenticated, getCategoryById);
router.put('/:id', isAuthenticated, checkAdmin, updateCategory);
router.delete('/:id', isAuthenticated, checkAdmin, deleteCategory);

module.exports = router;
