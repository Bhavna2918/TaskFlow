import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400);
        return next(new Error(errorMessages));
      }
      next(error);
    }
  };
};
