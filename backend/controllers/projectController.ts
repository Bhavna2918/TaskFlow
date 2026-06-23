import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import Project from '../models/Project';

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    if (currentUser.role === 'employee') {
      res.status(403);
      return next(new Error('Employees are not authorized to create projects'));
    }

    const project = await ProjectService.createProject(req.body, currentUser.id);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    let baseQuery: any = {};

    // Regular users and managers only see projects they are part of (unless Admin)
    if (currentUser.role !== 'admin') {
      baseQuery = {
        $or: [
          { creator: currentUser.id },
          { members: currentUser.id }
        ]
      };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const query: any = { ...baseQuery };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Default to unpaginated if page and limit not passed
    if (!req.query.page && !req.query.limit) {
      const projects = await ProjectService.getAllProjects(query);
      return res.json(projects);
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('creator', 'name email role avatar employeeId')
      .populate('members', 'name email role avatar employeeId')
      .populate('tasks')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      projects,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id as string);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const currentUser = (req as any).user;
    if (
      currentUser.role !== 'admin' &&
      project.creator.toString() !== currentUser.id &&
      !project.members.some(m => m._id.toString() === currentUser.id)
    ) {
      res.status(403);
      return next(new Error('Not authorized to access this project'));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id as string);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const currentUser = (req as any).user;
    if (currentUser.role !== 'admin' && project.creator.toString() !== currentUser.id) {
      res.status(403);
      return next(new Error('Not authorized to update this project'));
    }

    const updated = await ProjectService.updateProject(req.params.id as string, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id as string);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const currentUser = (req as any).user;
    if (currentUser.role !== 'admin' && project.creator.toString() !== currentUser.id) {
      res.status(403);
      return next(new Error('Not authorized to delete this project'));
    }

    await ProjectService.deleteProject(req.params.id as string);
    res.json({ success: true, message: 'Project deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};
