const mongoose = require("mongoose");

const documentChangeSchema = new mongoose.Schema({
  versionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DocumentVersion", // Liên kết với phiên bản của tài liệu
    required: true,
  },
  changedContent: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DocumentChange", documentChangeSchema);
