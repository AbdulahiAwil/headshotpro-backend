import config from "@/config";
import { AppError, ValidationError } from "@/util/error"
import { errorResponse } from "@/util/response";
import { Request, Response, NextFunction } from "express";



export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {


    // Handle oprational errors

    if (err instanceof AppError) {
        const error = err instanceof ValidationError ? err.errors : undefined;
        return errorResponse(res, err.message, err.statusCode, error);
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        return errorResponse(res, "Validation failed", 400);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid token', 401);
      }

      if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }
 // Generic error (don't leak details in production)
    const message = config.env === 'development' 
    ? err.message 
    : 'Internal server error';

  return errorResponse(res, message, 500);
};

