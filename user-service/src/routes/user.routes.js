import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getProfile, updateProfile, deleteProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/get-profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.delete("/profile", requireAuth, deleteProfile);

export default router;