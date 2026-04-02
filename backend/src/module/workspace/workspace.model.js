import mongoose from "mongoose";
import slugify from "slugify";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "workspace name is required"],
      trim: true,
      minlength: [3, "workspace name must be at least 3 characters long"],
      maxlength: [100, "workspace name must be less than 100 characters long"],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
  { timestamps: true }
);

workspaceSchema.index({ ownerId: 1, createdAt: -1 });

workspaceSchema.pre("validate", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

workspaceSchema.statics.generateUniqueSlug = async function (name) {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 0;

  while (await this.exists({ slug })) {
    count++;
    slug = `${baseSlug}-${count}`;
  }

  return slug;
};

workspaceSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

workspaceSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

workspaceSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isDeleted: false });
};

const workspaceModel = mongoose.model("Workspace", workspaceSchema);
export default workspaceModel;

