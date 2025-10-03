
// Middleware to check if the authenticated user is an admin
const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Admin access required' });
  }
  next();
};

module.exports  = checkAdmin