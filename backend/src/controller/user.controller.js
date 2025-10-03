const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
 const registerUser = async (req, res) => {
     const { name, email, password, role } = req.body;
     try {
          let user = await User.findOne({ email });
          if (user) {
               return res.status(400).json({ message: 'User already exists' });
          }

          user = new User({ name, email, password, role });
          await user.save();

          const payload = { id: user._id, role: user.role };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

          // Set cookie
          res.cookie('jwt', token, {
               httpOnly: true,
               sameSite: 'strict',
               maxAge: 3600000 // 1 hour
          });

          return res.status(201).json({ message: 'User registered successfully' });
     } catch (error) {
          return res.status(500).json({ message: 'Server error' });
     }
}

 const loginUser = async (req, res) => {
     const { email, password } = req.body;
     try {
          const user = await User.findOne({ email }).select('+password');
          if (!user) {
               return res.status(400).json({ message: 'Invalid credentials' });
          }

          const isMatch = await user.comparePassword(password);
          if (!isMatch) {
               return res.status(400).json({ message: 'Invalid credentials' });
          }

          const payload = { id: user._id, role: user.role };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

          res.cookie('jwt', token, {
               httpOnly: true,
               sameSite: 'strict',
               maxAge: 3600000 // 1 hour in milliseconds
          });

          return res.json({ message: 'Login successful' });
     } catch (error) {
          return res.status(500).json({ message: 'Server error' });
     }
}
 const logoutUser = (req, res) => {
     res.clearCookie('jwt');
     return res.json({ message: 'Logged out successfully' });
};

 const getProfile = (req, res) => {
     return res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile
};