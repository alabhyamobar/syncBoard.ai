import mongoose from "mongoose";

const documentTextSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const documentTextModel = mongoose.model("DocumentText", documentTextSchema);
export default documentTextModel;
