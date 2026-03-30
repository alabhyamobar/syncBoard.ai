// modules/session/session.model.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ fixed
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ip: String,
    userAgent: String,
    revoked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, 
    },
  },
  { timestamps: true },
);

const sessionModel = mongoose.model("Session", sessionSchema);

export default sessionModel
