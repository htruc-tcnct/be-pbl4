const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");
const userController = require("../controller/user/user");
const upload = require("../middleware/img-multer");
router.get("/", userController.get_all_user);
router.get("/:id", userController.get_by_id);
router.post("/signup", userController.create_user);
router.post("/forgotPassword", userController.forgot_password);
router.post("/resetPassword/:id/:token", userController.reset_password);

router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.delete("/:userId", userController.delete_user);

router.post("/uploadImage", upload.single("avatar"), userController.upload_img); //ảnh đại diện user,chưa làm get
module.exports = router;
