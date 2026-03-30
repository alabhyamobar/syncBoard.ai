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

if(!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET || !process.env.GOOGLE_CALLBACK_URL){
    throw new Error("google_id or secret is not defined in environment variables")
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRETS:process.env.JWT_SECRET,
    JWT_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET,
    GOOGLE_ID:process.env.GOOGLE_ID,
    GOOGLE_SECRET:process.env.GOOGLE_SECRET,
    GOOGLE_CALLBACK_URL:process.env.GOOGLE_CALLBACK_URL
}

export default config;