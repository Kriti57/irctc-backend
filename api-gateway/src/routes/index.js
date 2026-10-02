import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createProxy } from "../services/proxy.js";
import { ipRateLimit, endpointRateLimit, combinedRateLimit } from "../middlewares/rateLimiting.middleware.js";
import config from "../config/index.js";

const router = express.Router();

const userServiceProxy = createProxy("userService", config.SERVICES.USER_SERVICE_URL);

// public routes
router.post(
  "/users/auth/login",
  endpointRateLimit(20, 900000), // max 20 req per 15 mins
  userServiceProxy
);

//private routes
router.get(
  "/users/user/profile",
  requireAuth,
  combinedRateLimit(),
  userServiceProxy
);

// gateway health
router.get("/gateway/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
    timestamp: new Date().toString(),
  });
});

export default router;