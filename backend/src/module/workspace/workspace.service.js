import mongoose from "mongoose";
import workspaceModel from "./workspace.model.js";
import workspaceMemberModel from "./worksopaceMember.model.js";

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
          workspaceId: workspace._id,
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
    throw err;
  }
};

export const inviteMember = async ({ workspaceId, emailUser, invitedBy }) => {
  const existing = await workspaceMemberModel.findOne({
    workspaceId,
    userId: emailUser._id,
    status: { $in: ["PENDING", "ACTIVE"] },
  });

  if (existing) {
    throw new Error("User already invited or member");
  }

  return WorkspaceMember.create({
    workspaceId,
    userId: emailUser._id,
    role: "VIEWER",
    status: "PENDING",
    invitedBy,
  });
};

export const acceptInvite = async ({ workspaceId, userId }) => {
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId,
    status: "PENDING",
  });

  if (!membership) {
    throw new Error("Invite not found");
  }

  return membership.acceptInvite();
};

export const updateMemberRole = async ({ workspaceId, memberId, role }) => {
  const member = await WorkspaceMember.findOne({
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
    const currentOwner = await WorkspaceMember.findOne({
      workspaceId,
      userId: currentOwnerId,
      role: "OWNER",
    }).session(session);

    if (!currentOwner) throw new Error("Not owner");

    const newOwner = await WorkspaceMember.findOne({
      workspaceId,
      userId: newOwnerId,
      status: "ACTIVE",
    }).session(session);

    if (!newOwner) throw new Error("New owner must be active member");


    currentOwner.role = "ADMIN";
    newOwner.role = "OWNER";

    await currentOwner.save({ session });
    await newOwner.save({ session });

    await Workspace.updateOne(
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
  const member = await WorkspaceMember.findOne({
    _id: memberId,
    workspaceId,
  });

  if (!member) throw new Error("Member not found");

  if (member.role === "OWNER") {
    throw new Error("Cannot remove owner");
  }

  return member.removeMember();
};

export const getUserWorkspaces = async (userId) => {
  return WorkspaceMember.find({
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
  const membership = await WorkspaceMember.findOne({
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
