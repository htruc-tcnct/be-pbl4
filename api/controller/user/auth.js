const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const express = require("express");
const User = require("../../models/user"); // Đường dẫn đến mô hình User trong database
const router = express.Router();
require("dotenv").config();
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile); // Debug: Log Google profile

        // Find user by email
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // If the user does not exist, create a new one with a generated ID
          const newUser = new User({
            _id: new mongoose.Types.ObjectId(), // Generate a new MongoDB ObjectId
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value || "", // Use profile photo if available
            password: null, // Google OAuth users don't have passwords
          });

          await newUser.save(); // Save the new user to the database
          console.log("New Google user created:", newUser);

          user = newUser; // Assign the new user to `user` for further processing
        } else {
          console.log("Existing Google user found:", user);
        }

        // Pass the user to the done callback
        return done(null, user);
      } catch (err) {
        console.error("Error authenticating Google user:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user ID into session
passport.serializeUser((user, done) => {
  if (user && user._id) {
    done(null, user._id); // Save user ID in the session
  } else {
    done(new Error("User serialization error"), null);
  }
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Find the user in the database by ID
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
// Routes for Google OAuth

// Initiate Google authentication
router.get(
  "/login/federated/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle Google callback
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}`, // Chuyển hướng khi thất bại
  }),
  (req, res) => {
    console.log("Authenticated User:", req.user); // Kiểm tra thông tin người dùng
    res.redirect(`${process.env.CLIENT_URL}/home`); // Chuyển hướng sau khi thành công
  }
);

// Successful login
router.get("/success", (req, res) => {
  if (req.user) {
    res.json({
      message: "Login successful",
      user: req.user, // Thông tin người dùng được gắn qua `passport.deserializeUser`
    });
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});

// Error during login
router.get("/error", (req, res) => {
  res.status(400).json({ message: "Error logging in via Google" });
});

// Logout route
router.get("/signout", (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(400).json({ message: "Failed to sign out user" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(400).json({ message: "Failed to destroy session" });
        }
        res.status(200).json({ message: "User signed out successfully" });
      });
    });
  } catch (err) {
    console.error("Unexpected error during signout:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
