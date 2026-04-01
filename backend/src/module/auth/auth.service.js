import userModel from "../user/user.model.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.js";

import { createSession, findSession } from "../session/session.service.js";
import jwt from "jsonwebtoken";
import config from "../../config/config.js";

export const registerService = async (data, req, res) => {
  const { username, email, password } = data;
  const exist = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (exist) {
    return res.status(409).json({
      message: "username or email is already registered",
    });
  };
  const user = await userModel.create({
    username,
    email,
    password:await hashPassword(password),
  });

  const refreshToken = generateRefreshToken(user);
  const session = await createSession({
    userId : user._id,
    refreshToken,
    req,
  });

  const accessToken =  generateAccessToken(user , session._id);

  return {user , accessToken , refreshToken};
};

export const loginService = async (data ,req , res)=>{
    const {email,password} = data;

    const user = await userModel.findOne({email}).select("+password");

    if(!user){
        return res.status(401).json({
            message:"user not found"
        });
    };

    const isValid = await comparePassword(password , user.password);
    if(!isValid){
        res.status(401).json({
            message : "invalid credentials"
        });
    }

    const refreshToken = generateRefreshToken(user);
    const session = await createSession({
        userId:user._id,
        refreshToken,
        req,
    });

    const accessToken = generateAccessToken(user , session._id);

    return {user,accessToken , refreshToken};
};

export const refreshService = async (refreshToken ,req,res)=>{
    const decoded = jwt.verify(
        refreshToken,
        config.JWT_REFRESH_SECRET
    );
    const session = await findSession(refreshToken);
    if(!session){
        return res.status(401).json({
            message : "invalid session"
        });
    };

    return {
        accessToken : generateAccessToken(
            {_id: decoded.id},
            session._id
        ),
    };
};
