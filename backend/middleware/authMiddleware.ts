import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Resolve token from HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback: resolve token from Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey') as { id: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    return next(new Error('Not authorized, token failed'));
  }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === 'admin') {
    next();
  } else {
    res.status(403);
    return next(new Error('Not authorized as an admin'));
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403);
      return next(
        new Error(
          `User role '${user?.role || 'none'}' is not authorized to access this route`
        )
      );
    }
    next();
  };
};
