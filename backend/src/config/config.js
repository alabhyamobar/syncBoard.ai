import dotenv from "dotenv"

dotenv.config();
if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in environment variable")
}
if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in environment variables")
}

if(!process.env.JWT_REFRESH_SECRET){
    throw new Error("JWT_REFRESH_SECRET is not defined in environment variables")
}

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

let callbackUrl = (process.env.GOOGLE_CALLBACK_URL || "").trim();

if (!callbackUrl) {
  callbackUrl = isProduction
    ? (process.env.GOOGLE_CALLBACK_PROD_URL || "https://syncboard-ai.onrender.com/api/auth/google/callback").trim()
    : (process.env.GOOGLE_CALLBACK_DEV_URL || "http://localhost:5000/api/auth/google/callback").trim();
}

if (isProduction && callbackUrl.includes("localhost")) {
  callbackUrl = (process.env.GOOGLE_CALLBACK_PROD_URL || "https://syncboard-ai.onrender.com/api/auth/google/callback").trim();
}

if (!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET || !callbackUrl) {
    throw new Error("Google OAuth ID, Secret, or Callback URL is not defined in environment variables");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRETS: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    GOOGLE_CALLBACK_URL: callbackUrl,
    FRONTEND_DEV_URL: (process.env.FRONTEND_DEV_URL || "http://localhost:5173").trim(),
    FRONTEND_PROD_URL: (process.env.FRONTEND_PROD_URL || "https://sync-board-ai.vercel.app").trim(),
    FRONTEND_URL: isProduction
      ? (process.env.FRONTEND_PROD_URL || "https://sync-board-ai.vercel.app").trim()
      : (process.env.FRONTEND_DEV_URL || "http://localhost:5173").trim(),
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
    SMTP_SECURE: process.env.SMTP_SECURE === "true",
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
}

export default config;