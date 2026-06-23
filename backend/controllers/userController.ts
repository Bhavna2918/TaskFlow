import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getAllUsers({});
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUserById(req.params.id as string);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.id as string;
    const currentUser = (req as any).user;

    // Authorization: User can update their own profile, or an admin can update any user
    if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
      res.status(403);
      return next(new Error('Not authorized to update this user profile'));
    }

    const updatedUser = await UserService.updateUser(targetUserId, req.body, currentUser.role);
    if (!updatedUser) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await UserService.deleteUser(req.params.id as string);
    if (!success) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json({ success: true, message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};
