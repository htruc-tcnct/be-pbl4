const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");
const userController = require("../controller/user/user");
const multer = require("multer");
// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Lưu file vào thư mục "uploads"
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.mimetype.split("/")[1];
    cb(null, `${uniqueSuffix}.${fileExtension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    cb(new Error("File không phải định dạng ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Các route khác
router.get("/", userController.get_all_user);
router.get("/:id", userController.get_by_id);
router.post("/signup", userController.create_user);
router.post("/forgotPassword", userController.forgot_password);
router.post("/resetPassword/:id/:token", userController.reset_password);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.delete("/:userId", checkAuth, userController.delete_user);

// Route cập nhật thông tin người dùng (bao gồm ảnh đại diện)
router.post(
  "/update-user",
  checkAuth,
  upload.single("avatar"),
  userController.update_user
);

router.get("/check-auth", checkAuth, (req, res) => {
  res.json({ authenticated: true });
});
module.exports = router;
