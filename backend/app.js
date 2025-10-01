const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./utils/database');
const passport = require('passport');
const authRoutes = require('./routes/auth.route');
require('dotenv').config();
require('./middleware/passportConfig'); // Initialize Passport JWT strategy

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.use('/auth', authRoutes); 


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectDB(); 
  console.log(`Server running on port ${PORT}`);
});