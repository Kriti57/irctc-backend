import express from "express";
import { sendOTP, verifyOTP, login, rotateRefreshToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/refresh", rotateRefreshToken);

export default router;