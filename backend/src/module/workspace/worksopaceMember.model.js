import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
      default: "VIEWER",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REMOVED"],
      default: "PENDING",
      index: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    joinedAt: {
      type: Date,
      default: null,
    },

    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

workspaceMemberSchema.index({ userId: 1, status: 1 });
workspaceMemberSchema.index({ workspaceId: 1, role: 1 });
workspaceMemberSchema.index({ workspaceId: 1, status: 1 });

workspaceMemberSchema.pre("save", async function (next) {
  if (this.isNew) {
    const exist = await mongoose.models.WorkspaceMember.findOne({
      workspaceId: this.workspaceId,
      userId: this.userId,
      status: { $in: ["PENDING", "ACTIVE"] },
    });

    if (exist) {
      throw new Error("User already a member of this workspace");
    }
  }
  next();
});

workspaceMemberSchema.methods.acceptInvite = function () {
  this.status = "ACTIVE";
  this.joinedAt = new Date();
  return this.save();
};

workspaceMemberSchema.methods.remove = function () {
  this.status = "REMOVED";
  this.removedAt = new Date();
  return this.save();
};

workspaceMemberSchema.statics.getActiveMembers = function (workspaceId) {
  return this.find({
    workspaceId,
    status: "ACTIVE",
  }).populate("userId", "name email");
};

workspaceMemberSchema.statics.getUserMembership = function (
  workspaceId,
  userId,
) {
  return this.findOne({
    workspaceId,
    userId,
    status: "ACTIVE",
  });
};


const workspaceMemberModel = mongoose.model(
  "WorkspaceMember",
  workspaceMemberSchema,
);
export default workspaceMemberModel;
