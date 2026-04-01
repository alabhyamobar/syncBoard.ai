import userModel from "./user.model.js";


export const getCurrentUSer = async(userId) =>{
    const user = await userModel.findById(userId).select("-password");

    if(!user){
        throw new Error("user not found");
    }

    return user;
}


export const getUserByIdService = async (userId) => {
    const user = await User.findById(userId).select(
      "name email avatar bio"
    );
  
    if (!user) {
      throw new Error("User not found");
    }
  
    return user;
  };


  export const updateUserService = async (userId, updateData) => {
    const { name, bio, avatar } = updateData;
  
    if (!name && !bio && !avatar) {
      throw new Error("Nothing to update");
    }
  
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, avatar },
      { new: true }
    ).select("-password");
  
    return updatedUser;
  };
  

  export const searchUsersService = async (query) => {
    if (!query) return [];
  
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email avatar")
      .limit(10);
  
    return users;
  };