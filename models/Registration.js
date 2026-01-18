const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
      required: true,
    },
    ticketType: {
      type: String,
      enum: ["standard", "vip", "premium", "student"],
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "blocked"],
      default: "registered",
    },
    registrationSource: {
      type: String,
      default: "web",
    },
    otpCode: String,
    otpExpiry: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Registration", registrationSchema);
