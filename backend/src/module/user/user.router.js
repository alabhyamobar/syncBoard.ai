import express from "express";
import {
  getMe,
  getUserById,
  updateProfile,
  searchUsers,
} from "./user.controller.js";

import { requiredAuth } from "../../middleware/auth.js";

const userRouter = express.Router();


userRouter.use(requiredAuth);

userRouter.get("/me", getMe);
userRouter.get("/search", searchUsers);
userRouter.get("/:id", getUserById);
userRouter.patch("/update", updateProfile);

export default userRouter;