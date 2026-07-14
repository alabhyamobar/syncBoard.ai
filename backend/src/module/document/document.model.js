import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workspace",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Document",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

documentSchema.index({ workspaceId: 1, updatedAt: -1 });

documentSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  if (typeof next === "function") next();
});

documentSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

const documentModel = mongoose.model("Document", documentSchema);
export default documentModel
