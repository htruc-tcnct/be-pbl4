const mongoose = require("mongoose");
const permissionSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  role: {
    type: String,
    enum: ["View", "Edit", "Restricted"],
    default: "Restricted",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Permission", permissionSchema);
