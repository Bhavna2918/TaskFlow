import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Import Middleware
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Import Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import calendarRoutes from './routes/calendarRoutes';
import reportsRoutes from './routes/reportsRoutes';
import projectRoutes from './routes/projectRoutes';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration (allow cookies credentials)
const allowedOrigins = process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json({ limit: '10mb' })); // Increased limit for Base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/projects', projectRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
