import mongoose from "mongoose";
import crypto from "crypto";
import workspaceModel from "./workspace.model.js";
import workspaceMemberModel from "./workspaceMember.model.js";

export const createWorkspace = async ({ userId, name }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const slug = await workspaceModel.generateUniqueSlug(name);

    const workspace = await workspaceModel.create(
      [
        {
          name,
          slug,
          ownerId: userId,
        },
      ],
      {
        session,
      },
    );

    await workspaceMemberModel.create(
      [
        {
          workspaceId: workspace[0]._id,
          userId,
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    return workspace[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const inviteMember = async ({ workspaceId, email, userId = null, invitedBy, role = "VIEWER" }) => {
  const query = {
    workspaceId,
    status: { $in: ["PENDING", "ACTIVE"] },
    $or: [],
  };
  if (userId) query.$or.push({ userId });
  query.$or.push({ email: email.toLowerCase() });

  const existing = await workspaceMemberModel.findOne(query);

  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new Error("User already a member of this workspace");
    }

    if (existing.status === "PENDING") {
      // Re-invite pending member (regenerate token and extend expiration)
      existing.inviteToken = crypto.randomBytes(32).toString("hex");
      existing.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      if (userId) existing.userId = userId;
      existing.role = role;
      existing.invitedBy = invitedBy;
      return existing.save();
    }
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return workspaceMemberModel.create({
    workspaceId,
    userId,
    email: email.toLowerCase(),
    role,
    status: "PENDING",
    invitedBy,
    inviteToken,
    inviteExpiresAt,
  });
};

export const acceptInvite = async ({ inviteToken, userId }) => {
  const membership = await workspaceMemberModel.findOne({
    inviteToken,
    status: "PENDING",
  });

  if (!membership) {
    throw new Error("Invite not found");
  }

  if (membership.inviteExpiresAt && membership.inviteExpiresAt < new Date()) {
    throw new Error("Invite expired");
  }

  return membership.acceptInvite(userId);
};

export const updateMemberRole = async ({ workspaceId, memberId, role }) => {
  const member = await workspaceMemberModel.findOne({
    _id: memberId,
    workspaceId,
  });

  if (!member) throw new Error("Member not found");

  if (member.role === "OWNER") {
    throw new Error("Cannot change owner role");
  }

  if (role === "OWNER") {
    throw new Error("Use transfer ownership instead");
  }

  member.role = role;
  return member.save();
};

export const transferOwnership = async ({
  workspaceId,
  currentOwnerId,
  newOwnerId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentOwner = await workspaceMemberModel.findOne({
      workspaceId,
      userId: currentOwnerId,
      role: "OWNER",
    }).session(session);

    if (!currentOwner) throw new Error("Not owner");

    const newOwner = await workspaceMemberModel.findOne({
      workspaceId,
      userId: newOwnerId,
      status: "ACTIVE",
    }).session(session);

    if (!newOwner) throw new Error("New owner must be active member");


    currentOwner.role = "ADMIN";
    newOwner.role = "OWNER";

    await currentOwner.save({ session });
    await newOwner.save({ session });

    await workspaceModel.updateOne(
      { _id: workspaceId },
      { ownerId: newOwnerId },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const removeMember = async ({ workspaceId, memberId }) => {
  const member = await workspaceMemberModel.findOne({
    _id: memberId,
    workspaceId,
  });

  if (!member) throw new Error("Member not found");

  if (member.role === "OWNER") {
    throw new Error("Cannot remove owner");
  }

  return member.deleteOne();
};

export const getUserWorkspaces = async (userId) => {
  return workspaceMemberModel.find({
    userId,
    status: "ACTIVE",
  })
    .populate("workspaceId")
    .sort({ createdAt: -1 });
};

export const checkWorkspaceAccess = async ({
  workspaceId,
  userId,
  roles = [],
}) => {
  const membership = await workspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: "ACTIVE",
  });

  if (!membership) throw new Error("Access denied");

  if (roles.length && !roles.includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }

  return membership;
};
