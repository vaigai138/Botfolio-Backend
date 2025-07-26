// middleware/adminMiddleware.js
const authorizeAdmin = (req, res, next) => {
  // `req.user` should be populated by your `protect` middleware
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed to the next middleware/route handler
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export default authorizeAdmin;