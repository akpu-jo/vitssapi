import AppError from "../utils/appError.js";

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `${errors.join('; ')}`;
  return new AppError(message, 400);
};

const handleDuplicateKey = (err) => {
  const value = JSON.stringify(err.keyValue)
    .replace(/[{}"]/g, "")
    .split(":")[0];
  const message = `That ${value} is taken. Try another one`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: err.success,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
    });
  } else {
    console.error("Error!!!", err);
    res.status(500).json({
      success: err.success,
      message: "Server error, please try again",
    });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.success = false;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastError(error);
    if (err.name === "ValidationError") error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateKey(error);
    sendErrorProd(error, res);
  }
};
