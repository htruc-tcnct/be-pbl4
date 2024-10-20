module.exports = (req, res, next) => {
  console.log("Session data:", req.session);
  console.log("User data:", req.user);

  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({
      message: "Auth failed: User not authenticated",
    });
  }
};
