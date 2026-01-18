const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    userAgent: String,
    browser: String,
    os: String,
    device: String,
    ip: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LoginLog", loginLogSchema);
