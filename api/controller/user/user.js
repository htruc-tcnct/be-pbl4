const bcrypt = require("bcrypt");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const passport = require("passport");
const multer = require("multer");
const OAuth2 = google.auth.OAuth2;
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
exports.get_all_user = (req, res, next) => {
  User.find()
    .select("email password _id avatar")
    .exec()
    .then((r) => {
      const respone = {
        count: r.length,
        users: r.map((doc) => {
          return {
            email: doc.email,
            password: doc.password,
            _id: doc._id,
            avatar: doc.avatar,
            request: {
              type: "GET",
              url: "http://localhost:3000/user/" + doc._id,
            },
          };
        }),
      };
      if (r.length > 0) res.status(201).json(respone);
      else {
        res.status(404).json({ message: "No entries found" });
      }
    });
};
exports.get_by_id = (req, res, next) => {
  const id = req.params.id;

  User.findById(id)
    .exec()
    .then((user) => {
      if (user) {
        const response = {
          name: user.name,
          email: user.email,
          _id: user._id,
          avatar: user.avatar,
          request: {
            type: "GET",
            url: "http://localhost:3000/user/" + user._id,
          },
        };
        res.status(200).json(response); // Trả về thông tin người dùng
      } else {
        res.status(404).json({ message: "No user found with this ID" }); // Không tìm thấy người dùng
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Error finding user", error: err }); // Xử lý lỗi
    });
};

exports.create_user = (req, res, next) => {
  console.log("Request Body:", req.body); // Log request body

  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length > 0) {
        res.status(422).json({
          message: "Mail exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const newUser = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              dateOfBirth: req.body.dateOfBirth,
              name: req.body.name,
            });

            newUser
              .save()
              .then((result) => {
                res.status(201).json({
                  message: "User created",
                  result: result,
                });
              })
              .catch((err) => {
                res.status(500).json({ error: err });
                console.log(err);
              });
          }
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err: err });
    });
};
exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "An error occurred", error: err });
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: "Auth failed", detail: "Invalid email or password" });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed", error: err });
      }
      // Send a response indicating successful login
      res.status(200).json({
        message: "Auth successful",
        user: { id: user._id, email: user.email, name: user.name },
      });
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Session destruction failed" });
      }

      res.clearCookie("connect.sid"); // Clear the session cookie
      console.log("User logged out and session destroyed successfully");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
};

// exports.login = (req, res, next) => {
//   User.find({ email: req.body.email })
//     .exec()
//     .then((user) => {
//       if (user.length < 1) {
//         res.status(401).json({ message: "Auth failed" });
//       } else {
//         bcrypt.compare(req.body.password, user[0].password, (err, result) => {
//           if (err) {
//             res.status(401).json({
//               message: "Auth failed",
//               detail: "Password is invalid",
//             });
//           }
//           if (result) {
//             const token = jwt.sign(
//               {
//                 email: user[0].email,
//                 userId: user[0]._id,
//                 name: user[0].name,
//               },
//               "secret",
//               {
//                 expiresIn: "1h",
//               }
//             );
//             return res.status(200).json({
//               message: "Auth successful",
//               token: token,
//             });
//           }
//           res.status(401).json({ message: "Auth failed" });
//         });
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).json({ err: err });
//     });
// };

exports.delete_user = (req, res, next) => {
  User.deleteOne({ _userId: req.params.id })
    .exec()
    .then(
      res.status(201).json({
        message: "User deleted",
      })
    )
    .catch((err) => {
      res.status(500).json({ error: err });
      console.log(err);
    });
};

exports.forgot_password = (req, res) => {
  const { email } = req.body;
  try {
    User.findOne({ email })
      .exec()
      .then(async (result) => {
        if (!result) {
          return res.status(404).json({ message: "User does not exist" });
        }
        const nameUser = result.name;
        const secret = process.env.RESET_PASSWORD_KEY;
        const token = jwt.sign(
          { email: result.email, id: result._id },
          secret,
          {
            expiresIn: "10m",
          }
        );
        const link = `${process.env.CLIENT_URL}/user/resetPassword/${result._id}/${token}`;
        try {
          const accessToken = await oAuth2Client.getAccessToken();
          var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: "docsync9@gmail.com",
              clientId: process.env.CLIENT_ID,

              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESH_TOKEN,
              accessToken: accessToken,
            },
          });

          var mailOptions = {
            from: "DOCSYNC  :: <docsync9@gmail.com>",
            to: email,
            subject: "[DOCSYNC] Password reset request",

            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h5 {
      color: #333333;
    }
    p {
      color: #555555;
      line-height: 1.6;
    }
    .reset-link {
      display: inline-block;
      background-color: #007bff;
      color: #ffffff;
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .reset-link:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 30px;
      color: #999999;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h5>Hello ${nameUser},</h5>
    <p>At your request, DocSync is sending you a link to reset your account password. Please click the link below to proceed with resetting your password:</p>
    
    <h6>Reset Password Link:</h6>
    <a href="${link}" class="reset-link">Reset Password</a>

    <p>If the button above doesn’t work, you can copy and paste the following URL into your browser:</p>
    <a href="${link}">${link}</a>

    <p>Thank you and have a wonderful day!</p>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DocSync. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        } catch (err) {
          console.log(err);
        }
        // You should send the response back to the client with a success message or instructions.
        res.status(200).json({
          message: "Password reset link generated",
          token: token,
          _id: result._id,
        });
      })
      .catch((err) => {
        // Handle error properly
        return res
          .status(500)
          .json({ message: "Error finding user", error: err });
      });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};
exports.reset_password = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    // Find the user by id
    const user = await User.findById(id).exec();

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const secret = process.env.RESET_PASSWORD_KEY;

    try {
      // Verify the token
      const verified = jwt.verify(token, secret);

      // Encrypt the new password
      const encryptedPassword = await bcrypt.hash(password, 10);

      // Update the user's password in the database
      await User.updateOne(
        { _id: id },
        {
          $set: {
            password: encryptedPassword,
          },
        }
      );

      res.status(201).json({ message: "Password updated successfully" });
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired token", error: err.message });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
exports.upload_img = (req, res) => {
  const { email } = req.body;
  const imagePath = req.file.path; // Multer stores the file and we get the path

  User.updateOne({ email: email }, { avatar: imagePath })
    .then((result) => {
      console.log("Cập nhật thành công:", result);
    })
    .catch((error) => {
      console.error("Lỗi khi cập nhật:", error);
    });
};
