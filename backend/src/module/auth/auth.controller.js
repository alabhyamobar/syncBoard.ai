import {
  registerService,
  loginService,
  refreshService,
} from "./auth.service.js";

import {
  revokeSession,
  revokeAllSessions,
  createSession,
} from "../session/session.service.js";

import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.js";

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

export const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await registerService(
    req.body,
    req,
    res,
  );

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(201).json({ user, accessToken, refreshToken });
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await loginService(
    req.body,
    req,
    res,
  );

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.json({ user, accessToken, refreshToken });
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const { accessToken } = await refreshService(
      token,
      req,
      res,
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid session" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(400).json({
      message: "No refresh token",
    });
  }

  await revokeSession(refreshToken);

  res.clearCookie("refreshToken", clearCookieOptions);

  res.json({
    message: "Logged out successfully",
  });
};

export const logoutAll = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(400).json({
      message: "No refresh token",
    });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  await revokeAllSessions(decoded.id);

  res.clearCookie("refreshToken", clearCookieOptions);

  res.json({
    message: "Logged out from all devices",
  });
};

export const googleCallback = async (req, res) => {
  const user = req.user;

  const refreshToken = generateRefreshToken(user);

  const session = await createSession({
    userId: user._id,
    refreshToken,
    req,
  });

  const accessToken = generateAccessToken(user, session._id);

  res.cookie("refreshToken", refreshToken, cookieOptions);

  const frontendUrl = (process.env.FRONTEND_URL || "").trim() || (
    isProduction
      ? (process.env.FRONTEND_PROD_URL || "https://sync-board-ai.vercel.app").trim()
      : (process.env.FRONTEND_DEV_URL || "http://localhost:5173").trim()
  );

  res.redirect(`${frontendUrl}/dashboard?token=${accessToken}&refreshToken=${refreshToken}`);
};
