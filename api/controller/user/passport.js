// config/passport.js or similar
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user"); // Adjust the path as necessary
const bcrypt = require("bcrypt");

// Define the local strategy

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" }, // Use email and password fields
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) {
          return done(null, false, { message: "Incorrect email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect email or password." });
        }

        // Successful authentication
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
