module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log("User authenticated:", req.user);
    return next(); // Tiếp tục nếu người dùng đã xác thực
  } else {
    return res.status(401).json({
      message: "Auth failed: User not authenticated",
    });
  }
};
