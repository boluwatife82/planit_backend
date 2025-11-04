// middleware/errorHandler.js

export const errorHandler = (err, req, res, next) => {
  console.error(err); // Log error for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err.details || null, // Optional: for validation errors
  });
};
