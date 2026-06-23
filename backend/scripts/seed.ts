import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import User from '../models/User';
import Task from '../models/Task';
import Project from '../models/Project';
import Message from '../models/Message';
import Notification from '../models/Notification';

dotenv.config();

const seed = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for clean database seeding...');

    // 1. Clean existing collections
    await User.deleteMany({});
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared all legacy mock data.');

    // 2. Create a clean system administrator account
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@taskflow.com',
      password: 'admin123',
      role: 'admin',
      team: 'Management',
      avatar: '', // Optional profile photo (initials avatar fallback on client)
      productivity: 100,
      completionRate: 100,
      performanceScore: 10.0
    });

    console.log('\n=== DATABASE INITIALIZED SUCCESSFULLY ===');
    console.log(`Admin User Created: ${adminUser.name} (${adminUser.email})`);
    console.log('Password: admin123');
    console.log('Employee ID Assigned:', adminUser.employeeId);
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seed();
