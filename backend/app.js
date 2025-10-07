const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./src/utils/database');
const passport = require('passport');
const userRoute = require('./src/routes/user.route');
require('dotenv').config();
const cors = require('cors');
require('./src/middleware/passportConfig'); // Initialize Passport JWT strategy
const blogRoutes = require('./src/routes/blog.route');
const portfolioRoutes = require('./src/routes/portfolio.route');
const mediaRoute = require('./src/routes/media.route');
const categoryRoutes = require('./src/routes/blogCategory.route');
const path = require('path');
const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
  return res.json({ message: 'Server is running!' });
});

app.use('/user', userRoute);
app.use('/blogs', blogRoutes);
app.use('/portfolios', portfolioRoutes);
app.use('/media', mediaRoute);
app.use('/categories', categoryRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectDB(); 
  console.log(`Server running on port ${PORT}`);
});