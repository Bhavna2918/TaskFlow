import Task, { ITask } from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import { sendRealTimeNotification } from '../socket';

export class TaskService {
  static async getTasks(query: any = {}): Promise<ITask[]> {
    return await Task.find(query)
      .populate('assignedToId', 'name email role avatar team employeeId')
      .populate('assignedById', 'name email role avatar employeeId')
      .populate('projectId', 'name description');
  }

  static async getTaskById(id: string): Promise<ITask | null> {
    return await Task.findById(id)
      .populate('assignedToId', 'name email role avatar team employeeId')
      .populate('assignedById', 'name email role avatar employeeId')
      .populate('projectId', 'name description');
  }

  static async createTask(taskData: Partial<ITask>, creatorName: string, creatorId: string): Promise<ITask> {
    const { title, description, assignedToId, priority, status, deadline, category, projectId, labels } = taskData;

    const assignedUser = await User.findById(assignedToId);
    if (!assignedUser) {
      throw new Error('Assigned user not found');
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignedTo: assignedUser.name,
      assignedToId,
      assignedBy: creatorName,
      assignedById: new mongoose.Types.ObjectId(creatorId),
      projectId: projectId || null,
      deadline,
      category: category || 'General',
      creator: creatorName,
      labels: labels || [],
      attachments: [],
      comments: [],
      history: [
        {
          user: creatorName,
          action: 'created the task',
          timestamp: new Date()
        }
      ]
    });

    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $addToSet: { tasks: task._id }
      });
    }

    const notification = await Notification.create({
      userId: assignedToId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: ${task.title} by ${creatorName}`,
      read: false,
      timestamp: new Date()
    });

    sendRealTimeNotification(assignedToId!.toString(), notification.toJSON());

    return task;
  }

  static async updateTask(id: string, updateData: any, user: { name: string; id: string; role: string; team: string }): Promise<ITask | null> {
    const task = await Task.findById(id);
    if (!task) {
      return null;
    }

    const { title, description, priority, status, deadline, category, progress, assignedToId, projectId, labels, comments, attachments } = updateData;

    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssignedToId = task.assignedToId.toString();

    // 1. Fields only Admins and Managers can change
    if (user.role === 'admin' || user.role === 'manager') {
      if (title !== undefined && title !== task.title) {
        task.history.push({ user: user.name, action: `renamed task to "${title}"`, timestamp: new Date() });
        task.title = title;
      }
      if (description !== undefined) task.description = description;
      if (category !== undefined) task.category = category;
      if (labels !== undefined) task.labels = labels;

      if (priority !== undefined && priority !== oldPriority) {
        task.history.push({ user: user.name, action: `changed priority from ${oldPriority} to ${priority}`, timestamp: new Date() });
        task.priority = priority;
      }

      if (deadline !== undefined && deadline !== task.deadline) {
        task.history.push({ user: user.name, action: `changed deadline to ${deadline}`, timestamp: new Date() });
        task.deadline = deadline;
      }

      if (projectId !== undefined && (task.projectId ? task.projectId.toString() : null) !== projectId) {
        if (task.projectId) {
          await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: task._id } });
        }
        if (projectId) {
          await Project.findByIdAndUpdate(projectId, { $addToSet: { tasks: task._id } });
        }
        task.projectId = projectId ? new mongoose.Types.ObjectId(projectId) : undefined;
      }

      if (assignedToId !== undefined && assignedToId !== oldAssignedToId) {
        const newAssignee = await User.findById(assignedToId);
        if (!newAssignee) {
          throw new Error('New assignee not found');
        }
        task.history.push({ user: user.name, action: `reassigned task to ${newAssignee.name}`, timestamp: new Date() });
        task.assignedTo = newAssignee.name;
        task.assignedToId = new mongoose.Types.ObjectId(assignedToId);

        const notification = await Notification.create({
          userId: assignedToId,
          type: 'task_assigned',
          title: 'Task Reassigned to You',
          message: `You have been assigned: ${task.title}`,
          read: false,
          timestamp: new Date()
        });

        sendRealTimeNotification(assignedToId, notification.toJSON());
      }
    }

    // 2. Status & Progress Changes (Any role if they are assignee, manager, or admin)
    if (status !== undefined && status !== oldStatus) {
      task.status = status;
      if (progress === undefined) {
        if (status === 'Completed') task.progress = 100;
        else if (status === 'Review') task.progress = 90;
        else if (status === 'In Progress' && task.progress === 0) task.progress = 40;
        else if (status === 'To Do') task.progress = 0;
      }

      task.history.push({ user: user.name, action: `moved task to "${status}"`, timestamp: new Date() });

      const notifyUserId = user.id === task.assignedToId.toString() ? task.assignedById : task.assignedToId;
      if (notifyUserId) {
        const notification = await Notification.create({
          userId: notifyUserId,
          type: status === 'Completed' ? 'completed' : 'status_updated',
          title: status === 'Completed' ? 'Task Completed 🎉' : 'Task Status Updated',
          message: `Task "${task.title}" is now "${status}" (updated by ${user.name})`,
          read: false,
          timestamp: new Date()
        });

        sendRealTimeNotification(notifyUserId.toString(), notification.toJSON());
      }
    }

    if (progress !== undefined && progress !== task.progress) {
      task.progress = progress;
      task.history.push({ user: user.name, action: `updated progress to ${progress}%`, timestamp: new Date() });
    }

    // 3. Comments (Scan for mentions)
    if (comments !== undefined) {
      const oldCommentsCount = task.comments.length;
      task.comments = comments;

      if (comments.length > oldCommentsCount) {
        const newComm = comments[comments.length - 1];
        task.history.push({ 
          user: user.name, 
          action: `commented: "${newComm.text.substring(0, 30)}${newComm.text.length > 30 ? '...' : ''}"`, 
          timestamp: new Date() 
        });

        const matches = newComm.text.match(/@(\w+)/g);
        if (matches) {
          for (let m of matches) {
            const nameToFind = m.replace('@', '').toLowerCase();
            const mentionedUser = await User.findOne({ name: new RegExp('^' + nameToFind + '$', 'i') });
            if (mentionedUser && mentionedUser.id !== user.id) {
              const notification = await Notification.create({
                userId: mentionedUser._id,
                type: 'announcement',
                title: 'You were mentioned',
                message: `${user.name} mentioned you in task: ${task.title}`,
                read: false,
                timestamp: new Date()
              });

              sendRealTimeNotification(mentionedUser.id, notification.toJSON());
            }
          }
        }
      }
    }

    // 4. Attachments
    if (attachments !== undefined) {
      const oldAttachmentsCount = task.attachments ? task.attachments.length : 0;
      task.attachments = attachments;
      if (attachments.length > oldAttachmentsCount) {
        const newAttach = attachments[attachments.length - 1];
        task.history.push({ user: user.name, action: `uploaded file: ${newAttach.name}`, timestamp: new Date() });
      }
    }

    await task.save();
    return await TaskService.getTaskById(task.id);
  }

  static async deleteTask(id: string, user: { name: string; id: string; role: string; team: string }): Promise<boolean> {
    const task = await Task.findById(id);
    if (!task) {
      return false;
    }

    if (task.projectId) {
      await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: task._id } });
    }

    if (task.assignedToId) {
      const notification = await Notification.create({
        userId: task.assignedToId,
        type: 'announcement',
        title: 'Task Deleted',
        message: `Task "${task.title}" has been deleted by ${user.name}`,
        read: false,
        timestamp: new Date()
      });

      sendRealTimeNotification(task.assignedToId.toString(), notification.toJSON());
    }

    await task.deleteOne();
    return true;
  }
}
