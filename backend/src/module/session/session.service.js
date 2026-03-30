import sessionModel from "./session.model.js";
import { hashToken , compareToken } from "../../utils/hash.js";


export const createSession = async({userId,refreshToken , req})=>{
    const hash = await hashToken(refreshToken);

    return sessionModel.create({
        user:userId,
        refreshTokenHash : hash,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    })
};

export const findSession = async (refreshToken)=>{
    const sessions = await sessionModel.find({revoked:false});

    for(let session of sessions){
        const match = await compareToken(refreshToken , session.refreshTokenHash);
        if(match) return session;
    };

    return null
    
}

export const revokeSession = async (refreshToken)=>{
    const session = await findSession(refreshToken);

    if(!session) return null;

    session.revoked  = true;
    await session.save();

    return session;
}

export const revokeAllSessions = async (userId)=>{
    await sessionModel.updateMany(
        {user:userId , revoked:false},
        {revoked:true}
    );
};