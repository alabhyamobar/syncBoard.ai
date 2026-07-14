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
      required: false,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
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

    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    inviteExpiresAt: {
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

// Use partial indexes so that unique constraints are ignored for missing/null values
workspaceMemberSchema.index(
  { workspaceId: 1, userId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { userId: { $exists: true, $ne: null } } 
  }
);

workspaceMemberSchema.index(
  { workspaceId: 1, email: 1 },
  { 
    unique: true, 
    partialFilterExpression: { email: { $exists: true, $ne: null } } 
  }
);

workspaceMemberSchema.index({ userId: 1, status: 1 });
workspaceMemberSchema.index({ workspaceId: 1, role: 1 });
workspaceMemberSchema.index({ workspaceId: 1, status: 1 });

workspaceMemberSchema.pre("save", async function (next) {
  if (this.isNew) {
    const query = {
      workspaceId: this.workspaceId,
      status: { $in: ["PENDING", "ACTIVE"] },
      $or: [],
    };
    if (this.userId) query.$or.push({ userId: this.userId });
    if (this.email) query.$or.push({ email: this.email });

    if (query.$or.length > 0) {
      const exist = await mongoose.models.WorkspaceMember.findOne(query);
      if (exist) {
        throw new Error("User already a member of this workspace");
      }
    }
  }
  if (typeof next === "function") next();
});

workspaceMemberSchema.methods.acceptInvite = function (userId) {
  this.status = "ACTIVE";
  if (userId) this.userId = userId;
  this.joinedAt = new Date();
  this.inviteToken = null;
  this.inviteExpiresAt = null;
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
    status: { $in: ["ACTIVE", "PENDING"] },
  }).populate("userId", "username email avatar");
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
