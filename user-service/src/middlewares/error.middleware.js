import { AppError } from "../utils/error.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  console.error("UNHANDLED ERROR:", err);

  res.status(500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
};