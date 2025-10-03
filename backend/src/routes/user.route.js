const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getProfile } = require('../controller/user.controller');
const {  isAuthenticated } = require('../middleware/passportConfig');

router.post('/register',registerUser);

router.post('/login', loginUser);

router.get('/profile', isAuthenticated, getProfile);

router.post('/logout', logoutUser);

module.exports = router;