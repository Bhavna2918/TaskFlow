import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

describe('Auth API Endpoints', () => {
  let tokenCookie: string = '';
  const testUser = {
    name: 'Jest Test User',
    email: `jest_test_${Date.now()}@taskflow.com`,
    password: 'password123',
    role: 'employee',
    team: 'Engineering'
  };

  beforeAll(async () => {
    // Connect to database if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow');
    }
  });

  afterAll(async () => {
    // Clean up test user
    await User.deleteMany({ email: testUser.email });
    // Close database connection
    await mongoose.connection.close();
  });

  it('should fail to register a user with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        email: 'invalid-email'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should successfully register a new user and set HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(testUser.name);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.role).toBe(testUser.role);
    expect(res.body).toHaveProperty('employeeId'); // EMP-XXXX format
    expect(res.body.employeeId).toMatch(/^EMP-\d+/);

    // Verify Set-Cookie header is set
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies as string];
    const token = cookieArray.find((cookie: string) => cookie && cookie.startsWith('token='));
    expect(token).toBeDefined();
    tokenCookie = token || '';
  });

  it('should fail to register a duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
  });

  it('should successfully login and set cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies as string];
    const token = cookieArray.find((cookie: string) => cookie && cookie.startsWith('token='));
    expect(token).toBeDefined();
  });

  it('should successfully retrieve current logged in user details using cookies', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [tokenCookie]);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.name).toBe(testUser.name);
  });

  it('should block access to get current user details when unauthenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
