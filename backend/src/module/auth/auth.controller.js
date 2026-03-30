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

export const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await registerService(
    req.body,
    req,
    res,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user, accessToken });
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await loginService(
    req.body,
    req,
    res,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user, accessToken });
};

export const refresh = async (req, res) => {
  const { accessToken } = await refreshService(
    req.cookies.refreshToken,
    req,
    res,
  );

  res.json({ accessToken });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "No refresh token",
    });
  }

  await revokeSession(refreshToken);

  res.clearCookie("refreshToken");

  res.json({
    message: "Logged out successfully",
  });
};

export const logoutAll = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "No refresh token",
    });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  await revokeAllSessions(decoded.id);

  res.clearCookie("refreshToken");

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

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: {
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
};
