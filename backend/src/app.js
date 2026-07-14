import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import ratelimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import AuthUserRouter from "./module/auth/auth.router.js";
import passport from "passport";
import "./config/passport.js";
import userRouter from "../src/module/user/user.router.js";
import workspaceRouter from "./module/workspace/workspace.router.js";
import documentRouter from "./module/document/document.router.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173" , "https://sync-board-ai.vercel.app"],
    credentials: true, 
  }),
);
app.use(ratelimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(passport.initialize());

app.use(express.json());
app.use(cookieParser());

// app.use(
//     mongoSanitize({
//       allowDots: true,
//     })
//   );
// app.use(xss());

app.use(morgan("dev"));
app.use(compression());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SyncBoard API is running 🚀",
  });
});

app.use("/api/auth", AuthUserRouter);
app.use("/api/user", userRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/document", documentRouter);

export default app;
