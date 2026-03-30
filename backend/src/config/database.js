import mongoose from "mongoose";
import config from "./config.js";


export default async function connectDB() {
    await mongoose.connect(config.MONGO_URI);
    console.log("DB connection successfull");
}