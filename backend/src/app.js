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

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
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

app.use("/api/auth", AuthUserRouter);

export default app;
