import {
    getCurrentUser,
    getUserByIdService,
    updateUserService,
    searchUsersService,
  } from "./user.service.js";
  

  export const getMe = async (req, res) => {
    try {
      const user = await getCurrentUser(req.user.id);
  
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };
  
  export const getUserById = async (req, res) => {
    try {
      const user = await getUserByIdService(req.params.id);
  
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };
  

  export const updateProfile = async (req, res) => {
    try {
      const updatedUser = await updateUserService(
        req.user.id,
        req.body
      );
  
      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  

  export const searchUsers = async (req, res) => {
    try {
      const users = await searchUsersService(req.query.query);
  
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };