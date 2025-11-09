/**
 * @desc    Authorization middleware: Checks if user role is 'admin'
 * @notes   This middleware MUST run AFTER 'isAuth'
 */
const isAdmin = (req, res, next) => {
  // 'req.user' is attached by the 'isAuth' middleware
  if (req.user && req.user.role === "admin") {
    // User is an admin, proceed
    next();
  } else {
    // User is not an admin
    res.status(403).json({
      success: false,
      message:
        "Forbidden: You do not have admin privileges to access this resource.",
    });
  }
};

module.exports = isAdmin;
