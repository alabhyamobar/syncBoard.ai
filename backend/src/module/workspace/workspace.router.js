import express from "express";
import {
  createWorkspaceController,
  getUserWorkspacesController,
  getPendingInvitationsController,
  getWorkspaceByIdController,
  getWorkspaceBySlugController,
  deleteWorkspaceController,
  getMembersController,
  inviteMemberController,
  acceptInviteController,
  declineInviteController,
  updateMemberRoleController,
  transferOwnershipController,
  removeMemberController,
  getWorkspaceInviteInfoController
} from "./workspace.controller.js";
import { requiredAuth } from "../../middleware/auth.middleware.js";

const workspaceRouter = express.Router();

// Public invitation info query
workspaceRouter.get("/invite-info/:token", getWorkspaceInviteInfoController);

workspaceRouter.use(requiredAuth);

workspaceRouter.post("/", createWorkspaceController);
workspaceRouter.get("/", getUserWorkspacesController);
workspaceRouter.get("/invites", getPendingInvitationsController);
workspaceRouter.get("/:workspaceId", getWorkspaceByIdController);
workspaceRouter.get("/slug/:slug", getWorkspaceBySlugController);
workspaceRouter.delete("/:workspaceId", deleteWorkspaceController);

workspaceRouter.get("/:workspaceId/members", getMembersController);
workspaceRouter.post("/:workspaceId/members/invite", inviteMemberController);
workspaceRouter.patch("/accept-invite/:token", acceptInviteController);
workspaceRouter.delete("/decline-invite/:token", declineInviteController);
workspaceRouter.patch("/:workspaceId/members/:memberId/role", updateMemberRoleController);
workspaceRouter.patch("/:workspaceId/transfer-ownership", transferOwnershipController);
workspaceRouter.delete("/:workspaceId/members/:memberId", removeMemberController);

export default workspaceRouter;
