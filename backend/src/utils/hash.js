import bcrypt from "bcryptjs";

export const hashPassword = async (password) =>{
    return bcrypt.hash(password,10);
};

export const comparePassword = async (password ,hash)=>{
    return bcrypt.compare(password,hash);
};

export const hashToken  = async (token)=>{
    console.log(token)
    return bcrypt.hash(token,10);
};

export const compareToken = async (token , hash)=>{
    return bcrypt.compare(token , hash);
};