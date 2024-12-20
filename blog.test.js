const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');

let token;
let blogId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await Blog.deleteMany({});
  await User.deleteMany({});

  // Create a test user and log in
  const user = await request(app).post('/api/users/signup').send({
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@test.com',
    password: 'password123',
  });

  const login = await request(app).post('/api/users/signin').send({
    email: 'jane.doe@test.com',
    password: 'password123',
  });

  token = login.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Blog API Tests', () => {
  it('should create a blog in draft state', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My First Blog',
        description: 'This is a test blog.',
        tags: ['test', 'blog'],
        body: 'This is the body of my first blog.',
      });

    blogId = res.body._id;

    expect(res.statusCode).toEqual(201);
    expect(res.body.state).toBe('draft');
  });

  it('should fetch a list of published blogs', async () => {
    const res = await request(app).get('/api/blogs');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.blogs)).toBeTruthy();
  });

  it('should publish a blog', async () => {
    const res = await request(app)
      .patch(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ state: 'published' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.state).toBe('published');
  });

  it('should fetch a single published blog', async () => {
    const res = await request(app).get(`/api/blogs/${blogId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.read_count).toBe(1); // Read count is incremented
  });

  it('should delete a blog', async () => {
    const res = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Blog deleted successfully');
  });
});
