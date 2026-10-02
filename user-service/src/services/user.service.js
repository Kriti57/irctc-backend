import logger from "../config/logger.js";
import prisma from "../config/prisma.js";
import { redis } from "../config/redis.js";
import config from "../config/index.js";
import { NotFoundError } from "../utils/error.js";

const getProfile = async (userId) => {
  logger.info("First check user in Redis");

  const storeUser = await redis.get(`user:${userId}`);
  if (storeUser) {
    logger.info("Fetched user profile from redis");
    return JSON.parse(storeUser);
  }
  logger.info("If user is not in Redis, fetch user from db");
  const userProfile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userProfile) {
    throw new NotFoundError("User not found");
  }

  logger.info("Exclude password field from the user");
  const { password: _password, ...safeUser } = userProfile;
  logger.info("Store user profile in redis for future lookups");
  await redis.set(`user:${userId}`, JSON.stringify(safeUser), "EX", config.REDIS_USER_TTL);
  return safeUser;
};

const updateProfile = async(userId, updateData) => {
  const updatedUser = await prisma.user.update({
    where: {id: userId},
    data: updateData,
  });

  const {password: _password, ...safeUser} = updatedUser;

  await redis.set(`user:${userId}`, JSON.stringify(safeUser), "EX", config.REDIS_USER_TTL);

  return safeUser;
}

const deleteProfile = async (userId) => {
  // Find and clear every refresh-token session across all devices
  const refreshKeys = await redis.keys(`refresh:${userId}:*`);
  if (refreshKeys.length > 0) {
    await redis.del(...refreshKeys);
  }

  await redis.del(`user:${userId}`);

  await prisma.user.delete({
    where: { id: userId },
  });
};

export default { getProfile, updateProfile, deleteProfile };