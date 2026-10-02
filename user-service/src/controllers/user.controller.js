import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/error.js";
import userService from "../services/user.service.js";
import logger from "../config/logger.js";

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }

  const user = await userService.getProfile(userId);
  return res.status(200).json({
    success: true,
    message: "Fetched user details",
    data: {
      user,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if(!userId) {
    throw new BadRequestError("User Id is missing");
  }

  const {firstName, lastName} = req.body;

  if(!firstName && !lastName) {
    throw new BadRequestError("Atleast one field is required");
  }

  const updateData = {};
  if(firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  const updatedUser = await userService.updateProfile(userId, updateData);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { 
      user: updatedUser,
    },
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if(!userId) {
    throw new BadRequestError("User Id is missing");
  }

  await userService.deleteProfile(userId);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

export const getUserInternal = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }

  const user = await userService.getProfile(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
});