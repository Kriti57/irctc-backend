import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import config from "./config/index.js";
import logger from "./config/logger.js";
import userRoutes from "./routes/user.routes.js";
import corsMiddleware from "./middlewares/cors.middleware.js";
import reqMiddleware from "./middlewares/req.middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

import authRoutes from "./routes/auth.route.js";

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(reqMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use("/user", userRoutes);

// routes go here as you build them
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello from index.js of user-service")
})

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "ok"
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    const server = app.listen(config.PORT, () => {
      logger.info(`${config.SERVICE_NAME}  is running on http://localhost:${config.PORT}`);
    });

    // //graceful shutdown
    // const shutdown = async () => {
    //   logger.info("Shutting down...");

    //   server.close(async () => {
    //     await disconnectProducer();
    //     logger.info('Derver closed');
    //     process.exit(0)
    //   });  
    // };

    // process.on("SIGTERM", shutdown);
    // process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to Start Server", error);
    process.exit(1);
  }
};

startServer();