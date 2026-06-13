class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // our known errors vs unexpected crashes
  }
}

export default AppError;