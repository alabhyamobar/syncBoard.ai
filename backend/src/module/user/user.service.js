import userModel from "./user.model.js";


export const getCurrentUser = async(userId) =>{
    const user = await userModel.findById(userId).select("-password");

    if(!user){
        throw new Error("user not found");
    }

    return user;
}


export const getUserByIdService = async (userId) => {
    const user = await userModel.findById(userId).select(
      "username email avatar bio"
    );
  
    if (!user) {
      throw new Error("User not found");
    }
  
    return user;
  };


  export const updateUserService = async (userId, updateData) => {
    const { username, bio, avatar } = updateData;
  
    if (!username && !bio && !avatar) {
      throw new Error("Nothing to update");
    }
  
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { username, bio, avatar },
      { new: true }
    ).select("-password");
  
    return updatedUser;
  };
  

  export const searchUsersService = async (query) => {
    if (!query) return [];
  
    const users = await userModel.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("username email avatar")
      .limit(10);
  
    return users;
  };