const mongoose = require("mongoose");
const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/src/assets/"); // Specify the folder to store files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate unique filenames
  },
});
const upload = multer({ storage: storage });
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // Thư mục để lưu file
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     ); // Tên file
//   },
// });

// // Cấu hình multer với bộ nhớ đĩa và các giới hạn
// const upload = multer({
//   storage: storage,
//   fileFilter: function (req, file, cb) {
//     // Kiểm tra loại file
//     const filetypes = /doc|docx/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error("Only .doc and .docx files are allowed!"));
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước 5MB
// });
module.exports = upload;
