import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generateAccessToken = (user,sessionId)=>{
    return jwt.sign(
        {id:user._id , sessionId},
        config.JWT_SECRETS,
        {expiresIn:"15m"}
    );
};

export const generateRefreshToken = (user)=>{
    return jwt.sign(
        {id: user._id},
        config.JWT_REFRESH_SECRET,
        {expiresIn:"7d"}
    )
}