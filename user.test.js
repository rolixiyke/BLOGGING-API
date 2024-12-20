const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');

const testUser = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@test.com',
  password: 'password123',
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Authentication Tests', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/users/signup').send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User created successfully!');
  });

  it('should not allow duplicate email registration', async () => {
    const res = await request(app).post('/api/users/signup').send(testUser);
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('duplicate key error');
  });

  it('should log in the user and return a token', async () => {
    const res = await request(app).post('/api/users/signin').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app).post('/api/users/signin').send({
      email: testUser.email,
      password: 'wrongpassword',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
