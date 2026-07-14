import mongoose from "mongoose";

const documentCanvasSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const documentCanvasModel = mongoose.model("DocumentCanvas", documentCanvasSchema);
export default documentCanvasModel;
