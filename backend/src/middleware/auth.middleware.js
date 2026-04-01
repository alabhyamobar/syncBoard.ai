import jwt from "jsonwebtoken";
import userModel from "../module/user/user.model.js";
import sessionModel from "../module/session/session.model.js";
import config from "../config/config.js";


export const requiredAuth = async(req,res,next) => {
  try{
    const AuthHeader = req.headers.authorization;

    if(!AuthHeader || !AuthHeader.startsWith("Bearer ")){
      return res.status(401).json({
        success : false,
        message:"unauthorized : No token provided"
      })
    }

    const token  = AuthHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRETS);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    const session = await sessionModel.findOne({
      user:decoded.userId,
      revoked:false,
    })

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session not found or revoked",
      });
    }

    const user = await userModel.findById(decoded.userId).selsect("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      })
    }

    req.user = user;
    req.session = session

    next()
  }catch(err){
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}