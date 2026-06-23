import Project, { IProject } from '../models/Project';
import mongoose from 'mongoose';

export class ProjectService {
  static async getAllProjects(query: any = {}): Promise<IProject[]> {
    return await Project.find(query)
      .populate('creator', 'name email role avatar employeeId')
      .populate('members', 'name email role avatar employeeId')
      .populate('tasks');
  }

  static async getProjectById(id: string): Promise<IProject | null> {
    return await Project.findById(id)
      .populate('creator', 'name email role avatar employeeId')
      .populate('members', 'name email role avatar employeeId')
      .populate('tasks');
  }

  static async createProject(projectData: { name: string; description?: string; members?: string[] }, creatorId: string): Promise<IProject> {
    const { name, description, members } = projectData;

    let projectMembers: mongoose.Types.ObjectId[] = Array.isArray(members) 
      ? members.map(m => new mongoose.Types.ObjectId(m)) 
      : [];

    const creatorObjectId = new mongoose.Types.ObjectId(creatorId);
    
    if (!projectMembers.some(m => m.equals(creatorObjectId))) {
      projectMembers.push(creatorObjectId);
    }

    const project = await Project.create({
      name,
      description,
      creator: creatorObjectId,
      members: projectMembers
    });

    return project;
  }

  static async updateProject(id: string, updateData: { name?: string; description?: string; members?: string[]; tasks?: string[] }): Promise<IProject | null> {
    const project = await Project.findById(id);
    if (!project) {
      return null;
    }

    if (updateData.name !== undefined) project.name = updateData.name;
    if (updateData.description !== undefined) project.description = updateData.description;
    
    if (updateData.members !== undefined) {
      project.members = updateData.members.map(m => new mongoose.Types.ObjectId(m));
    }
    
    if (updateData.tasks !== undefined) {
      project.tasks = updateData.tasks.map(t => new mongoose.Types.ObjectId(t));
    }

    await project.save();
    return await ProjectService.getProjectById(project.id);
  }

  static async deleteProject(id: string): Promise<boolean> {
    const project = await Project.findById(id);
    if (!project) {
      return false;
    }
    await project.deleteOne();
    return true;
  }
}
