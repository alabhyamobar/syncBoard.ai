import {
    createWorkspace,
    inviteMember,
    acceptInvite,
    updateMemberRole,
    transferOwnership,
    removeMember,
    getUserWorkspaces,
    checkWorkspaceAccess,
  } from "./workspace.service.js";
  import workspaceModel from "./workspace.model.js";
  import workspaceMemberModel from "./workspaceMember.model.js";
  import userModel from "../user/user.model.js";
  import { sendInviteEmail } from "../../utils/email.js";
  
  // POST /workspaces
  export const createWorkspaceController = async (req, res) => {
    try {
      const { name } = req.body;
      const userId = req.user._id;
  
      if (!name) {
        return res.status(400).json({ message: "Workspace name is required" });
      }
  
      const workspace = await createWorkspace({ userId, name });
      return res.status(201).json({ message: "Workspace created", workspace });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // GET /workspaces
  export const getUserWorkspacesController = async (req, res) => {
    try {
      const userId = req.user._id;
      const memberships = await getUserWorkspaces(userId);
      return res.status(200).json({ workspaces: memberships });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // GET /workspaces/invites
  export const getPendingInvitationsController = async (req, res) => {
    try {
      const userId = req.user._id;
      const invites = await workspaceMemberModel.find({
        userId,
        status: "PENDING",
      }).populate("workspaceId");
      return res.status(200).json({ invites });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // GET /workspaces/:workspaceId
  export const getWorkspaceByIdController = async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user._id;
  
      // Verifies access and throws if not a member
      await checkWorkspaceAccess({ workspaceId, userId });
  
      const workspace = await workspaceModel.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      return res.status(200).json({ workspace });
    } catch (error) {
      if (error.message === "Access denied") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // GET /workspaces/slug/:slug
  export const getWorkspaceBySlugController = async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.user._id;
  
      const workspace = await workspaceModel.findBySlug(slug);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      await checkWorkspaceAccess({ workspaceId: workspace._id, userId });
  
      return res.status(200).json({ workspace });
    } catch (error) {
      if (error.message === "Access denied") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // DELETE /workspaces/:workspaceId (soft delete)
  export const deleteWorkspaceController = async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user._id;
  
      await checkWorkspaceAccess({ workspaceId, userId, roles: ["OWNER"] });
  
      const workspace = await workspaceModel.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      await workspace.softDelete();
      return res.status(200).json({ message: "Workspace deleted" });
    } catch (error) {
      if (["Access denied", "Insufficient permissions"].includes(error.message)) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // GET /workspaces/:workspaceId/members
  export const getMembersController = async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user._id;
  
      await checkWorkspaceAccess({ workspaceId, userId });
  
      const members = await workspaceMemberModel.getActiveMembers(workspaceId);
      return res.status(200).json({ members });
    } catch (error) {
      if (error.message === "Access denied") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // POST /workspaces/:workspaceId/members/invite
  export const inviteMemberController = async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { email, role } = req.body;
      const invitedBy = req.user._id;
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (role && !["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
        return res.status(400).json({ message: "Invalid workspace role" });
      }
  
      // Only OWNER or ADMIN can invite
      await checkWorkspaceAccess({
        workspaceId,
        userId: invitedBy,
        roles: ["OWNER", "ADMIN"],
      });
  
      const emailUser = await userModel.findOne({ email });
  
      const workspace = await workspaceModel.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      const membership = await inviteMember({
        workspaceId,
        email,
        userId: emailUser ? emailUser._id : null,
        invitedBy,
        role,
      });

      // Send neobrutalist styled email invitation
      const inviteLink = `http://localhost:5173/accept-invite/${membership.inviteToken}`;
      const invitedByName = req.user.username || req.user.email;
      await sendInviteEmail({
        to: email.toLowerCase(),
        workspaceName: workspace.name,
        invitedByName,
        inviteLink,
      });

      return res.status(201).json({ message: "Invitation sent", membership });
    } catch (error) {
      if (["Access denied", "Insufficient permissions"].includes(error.message)) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === "User already invited or member") {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // PATCH /workspaces/accept-invite/:token
  export const acceptInviteController = async (req, res) => {
    try {
      const { token } = req.params;
      const userId = req.user._id;
  
      const membership = await acceptInvite({ inviteToken: token, userId });
      return res.status(200).json({ message: "Invite accepted", membership });
    } catch (error) {
      if (error.message === "Invite not found" || error.message === "Invite expired") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // DELETE /workspaces/decline-invite/:token
  export const declineInviteController = async (req, res) => {
    try {
      const { token } = req.params;
  
      const membership = await workspaceMemberModel.findOne({
        inviteToken: token,
        status: "PENDING",
      });
  
      if (!membership) {
        return res.status(404).json({ message: "Invite not found" });
      }
  
      await workspaceMemberModel.deleteOne({ _id: membership._id });
      return res.status(200).json({ message: "Invite declined" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // PATCH /workspaces/:workspaceId/members/:memberId/role
  export const updateMemberRoleController = async (req, res) => {
    try {
      const { workspaceId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user._id;
  
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
  
      const validRoles = ["ADMIN", "EDITOR", "VIEWER"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: `Role must be one of: ${validRoles.join(", ")}`,
        });
      }
  
      // Only OWNER can change roles
      await checkWorkspaceAccess({
        workspaceId,
        userId,
        roles: ["OWNER"],
      });
  
      const updated = await updateMemberRole({ workspaceId, memberId, role });
      return res.status(200).json({ message: "Role updated", member: updated });
    } catch (error) {
      if (["Access denied", "Insufficient permissions"].includes(error.message)) {
        return res.status(403).json({ message: error.message });
      }
      if (
        ["Member not found", "Cannot change owner role", "Use transfer ownership instead"].includes(
          error.message
        )
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // PATCH /workspaces/:workspaceId/transfer-ownership
  export const transferOwnershipController = async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { newOwnerId } = req.body;
      const currentOwnerId = req.user._id;
  
      if (!newOwnerId) {
        return res.status(400).json({ message: "newOwnerId is required" });
      }
  
      await transferOwnership({ workspaceId, currentOwnerId, newOwnerId });
      return res.status(200).json({ message: "Ownership transferred" });
    } catch (error) {
      if (error.message === "Not owner") {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === "New owner must be active member") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };
  
  // DELETE /workspaces/:workspaceId/members/:memberId
  export const removeMemberController = async (req, res) => {
    try {
      const { workspaceId, memberId } = req.params;
      const userId = req.user._id;
  
      // Only OWNER can remove members
      await checkWorkspaceAccess({
        workspaceId,
        userId,
        roles: ["OWNER"],
      });
  
      await removeMember({ workspaceId, memberId });
      return res.status(200).json({ message: "Member removed" });
    } catch (error) {
      if (["Access denied", "Insufficient permissions"].includes(error.message)) {
        return res.status(403).json({ message: error.message });
      }
      if (["Member not found", "Cannot remove owner"].includes(error.message)) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  };

  // GET /workspaces/invite-info/:token
  export const getWorkspaceInviteInfoController = async (req, res) => {
    try {
      const { token } = req.params;
  
      const invite = await workspaceMemberModel.findOne({
        inviteToken: token,
        status: "PENDING",
      }).populate("workspaceId").populate("invitedBy", "username email");
  
      if (!invite) {
        return res.status(404).json({ message: "Invalid or expired invitation token" });
      }
  
      if (invite.inviteExpiresAt && invite.inviteExpiresAt < new Date()) {
        return res.status(400).json({ message: "This invitation token has expired" });
      }
  
      return res.status(200).json({
        workspace: {
          name: invite.workspaceId?.name || "Unknown Workspace",
          invitedBy: invite.invitedBy?.username || invite.invitedBy?.email || "Unknown User",
          email: invite.email,
        }
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };