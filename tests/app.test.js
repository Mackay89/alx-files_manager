const request = require('supertest');
const app = require('../app'); // Assuming your app entry point is in app.js

describe('API Endpoints', () => {
  it('GET /status should return 200 and correct message', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ redis: true, db: true });
  });

  it('GET /stats should return 200 and statistics', async () => {
    const res = await request(app).get('/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('files');
  });

  it('POST /users should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'user@example.com', password: 'password' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'user@example.com');
  });

  it('GET /users/me should return user information', async () => {
    // Assuming user is authenticated, pass token
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer your_token_here`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email');
  });

  it('POST /files should create a new file', async () => {
    const res = await request(app)
      .post('/files')
      .send({ name: 'file.txt', type: 'text/plain', data: 'Some content' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('GET /files/:id should retrieve file details', async () => {
    const res = await request(app).get('/files/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name');
  });

  it('GET /files with pagination should return paginated files', async () => {
    const res = await request(app).get('/files?page=1&limit=10');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('files');
  });

  it('PUT /files/:id/publish should publish a file', async () => {
    const res = await request(app).put('/files/1/publish');
    expect(res.statusCode).toEqual(200);
  });

  it('PUT /files/:id/unpublish should unpublish a file', async () => {
    const res = await request(app).put('/files/1/unpublish');
    expect(res.statusCode).toEqual(200);
  });

  it('GET /files/:id/data should return the file data', async () => {
    const res = await request(app).get('/files/1/data');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Some content');
  });
});

