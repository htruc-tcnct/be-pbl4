const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"], // Ensure name is required
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  resetLink: { type: String, default: "" },
  avatar: {
    type: String,

    default: "",
  },
});

module.exports = mongoose.model("User", userSchema);
