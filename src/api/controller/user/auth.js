const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oidc");
const User = require("../../models/user");
const FederatedCredential = require("../../models/federatedCredential");
const cors = require("cors");
const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/oauth2/redirect/google",
      // "/oauth2/redirect/google",
      scope: ["profile", "email"],
    },
    async function verify(issuer, profile, cb) {
      try {
        let cred = await FederatedCredential.findOne({
          provider: issuer,
          subject: profile.id,
        });

        if (!cred) {
          let existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            let newCredential = new FederatedCredential({
              user_id: existingUser._id,
              provider: issuer,
              subject: profile.id,
            });
            await newCredential.save();
            return cb(null, existingUser);
          } else {
            let newUser = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: null,
            });
            await newUser.save();

            let newCredential = new FederatedCredential({
              user_id: newUser._id,
              provider: issuer,
              subject: profile.id,
            });
            await newCredential.save();
            return cb(null, newUser);
          }
        } else {
          let user = await User.findById(cred.user_id);

          if (!user) {
            return cb(null, false);
          }
          return cb(null, user);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

router.get("/login/federated/google", passport.authenticate("google"));

// Google OAuth callbackroute
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}`, // On failure, redirect to frontend's landing page
  }),
  function (req, res) {
    res.redirect(`${process.env.CLIENT_URL}/home`);
  }
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user._id,
      idDoc: user.idDoc,
      name: user.name,
      email: user.email,
    }); // Thêm idDoc nếu cần
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user); // Đảm bảo `idDoc` hoặc các trường khác được bao gồm ở đây
  });
});

router.get("/user-info", (req, res) => {
  // console.log("Authenticated user:", req.user); // Debug log to verify user data
  res.json(req.user);
});
router.post("/update-user", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { name, dateOfBirth, avatar } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        dateOfBirth: new Date(dateOfBirth), // Chuyển đổi ngày tháng từ string sang Date
        avatar,
      },
      { new: true } // Tùy chọn trả về bản ghi đã được cập nhật
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user information" });
  }
});
// Logout route
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
