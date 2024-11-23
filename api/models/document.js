const mongoose = require("mongoose");
const crypto = require("crypto");
const documentSchema = new mongoose.Schema({
  documentTitle: {
    type: String,
    required: true,
  },
  documentPath: {
    type: String,
    required: true,
  },
  documentOwnerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  shareCode: {
    type: String,
    unique: true,
    default: null,
  },
  accessLevel: {
    type: String,
    enum: ["Restricted", "View", "Edit", "Owner"],
    default: "Restricted",
  },
  currentVersionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DocumentVersion",
    default: null,
  },
  permissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission", // Liên kết với bảng Permission
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.pre("save", function (next) {
  if (this.isShared && !this.shareCode) {
    this.shareCode = crypto.randomBytes(8).toString("hex");
  }
  this.updatedAt = Date.now();
  next();
});
module.exports = mongoose.model("Document", documentSchema);
