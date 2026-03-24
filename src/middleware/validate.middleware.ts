import {z, ZodError} from "zod";
import {NextFunction, Request, Response} from "express";
import { AppError, ValidationError } from "@/util/error";

export const validate = (Schema:z.ZodType<any>) =>  {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate = Schema.parse(req.body);
            req.body = validate;
            next();
            
        } catch (error) {

            if (error instanceof ZodError) {
                const errors = error.issues.map((issue) => ({
                    path : issue.path.join('.'),
                    message: issue.message
                }));
               next(new ValidationError("Validation failed", errors));
            }else {
                next(new AppError("Invalid request data"));
            }
            
        }
    }
}

// Verify token
export const validateQuery = (schema: z.ZodType<any>)=> {
  return(req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);

      Object.assign(req.query, validated);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // convert zod error to json
        const errors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Validation error", errors));
      } else {
        next(new AppError("Validation error", 400));
      }
    }
  }
}