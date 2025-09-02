import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
          timestamp: new Date().toISOString()
        });
      }
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        timestamp: new Date().toISOString()
      });
    }
  };
};
