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

const callbackUrl = (process.env.GOOGLE_CALLBACK_URL || "").trim() || (
  process.env.NODE_ENV === "production"
    ? (process.env.GOOGLE_CALLBACK_PROD_URL || "").trim()
    : (process.env.GOOGLE_CALLBACK_DEV_URL || "").trim()
);

if (!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET || !callbackUrl) {
    throw new Error("Google OAuth ID, Secret, or Callback URL is not defined in environment variables");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRETS: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    GOOGLE_CALLBACK_URL: callbackUrl
}

export default config;