import logger from "../config/logger.js";

const reqMiddleware = (req, res, next) => {
  logger.debug(`[${req.method}] ${req.originalUrl}`);
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      `[${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${Date.now() - start}ms`
    );
  });
  next();
};

export default reqMiddleware;