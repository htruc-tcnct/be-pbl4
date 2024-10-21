// middleware/check-auth.js
module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    return next();
  } else {
    return res.status(401).json({
      message: "Auth failed",
    });
  }
};
