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

  versionPath: {
    type: String, // Chỉ lưu những thay đổi nhỏ
  },

  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
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
