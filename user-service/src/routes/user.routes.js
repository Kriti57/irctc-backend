import express from "express";
import { getUserContext } from "../middlewares/getUserContext.middleware.js";
import { getProfile, updateProfile, deleteProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", getUserContext, getProfile);
router.put("/profile", getUserContext, updateProfile);
router.delete("/profile", getUserContext, deleteProfile);

export default router;