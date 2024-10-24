const mongoose = require("mongoose");

const documentVersionSchema = new mongoose.Schema({
  documentVersionID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  documentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  versionContent: {
    type: String, // Chỉ lưu những thay đổi nhỏ
  },
  content: {
    type: String, // Lưu toàn bộ nội dung tài liệu
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isRestored: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DocumentVersion", documentVersionSchema);
