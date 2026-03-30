import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  googleCallback,
} from "./auth.controller.js";
import passport from "passport";

const AuthUserRouter = express.Router();

AuthUserRouter.post("/register", register);
AuthUserRouter.post("/login", login);
AuthUserRouter.post("/refresh", refresh);

AuthUserRouter.post("/logout", logout);
AuthUserRouter.post("/logout-all", logoutAll);
AuthUserRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

AuthUserRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  googleCallback,
);

export default AuthUserRouter;
