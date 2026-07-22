import mongoose from "mongoose";
import config from "./config.js";

export default async function connectDB(maxRetries = 5, delayMs = 3000) {
  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    family: 4, 
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(config.MONGO_URI, options);
      console.log("[MONGO SUCCESS] Database connection established successfully.");
      return;
    } catch (err) {
      console.error(`[MONGO ERROR] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log(`[MONGO RETRY] Retrying database connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error("\n❌ MONGODB CONNECTION CRITICAL FAILURE.");
        console.error("1. Ensure your IP address is whitelisted in MongoDB Atlas Network Access (or add 0.0.0.0/0).");
        console.error("2. Verify MONGO_URI in your .env file.\n");
        throw err;
      }
    }
  }
}