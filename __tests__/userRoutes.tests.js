const request = require('supertest');

const BASE_URL = 'http://localhost:3001';

let testUserId = null;

describe('User CRUD Routes (Integration)', () => {
  describe('GET /users - Get all users', () => {
    it('should return all users successfully', async () => {
      const response = await request(BASE_URL).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /users/:id - Get user by ID', () => {
    const validUUID = 'a61ea8ad-498e-4811-82af-55505f83489a';

    it('should return user by valid ID', async () => {
      const response = await request(BASE_URL).get(`/users/${validUUID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validUUID);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(BASE_URL).get('/users/invalid-id');
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(BASE_URL).get('/users/6f4bfc69-0244-4d27-8912-73213f161f12');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /users/email/:email - Get user by email', () => {
    it('should return user by valid email', async () => {
      const email = 'jane.doe@epitech.eu';
      const response = await request(BASE_URL).get(`/users/email/${email}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(email);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(BASE_URL).get('/users/email/invalid-email');
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(BASE_URL).get('/users/email/nonexistentuser@test.com');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /users - Create new user', () => {
    it('should create user successfully', async () => {
      const newUser = {
        email: `user${Date.now()}@test.com`,
        password: 'password123'
      };

      const response = await request(BASE_URL).post('/users').send(newUser);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);

      testUserId = response.body.data.id;
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/users').send({ email: 'test@test.com' });
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(BASE_URL).post('/users').send({ email: 'bademail', password: 'password123' });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /users/:id - Update user', () => {

    it('should update user email successfully', async () => {
      expect(testUserId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/users/${testUserId}`)
        .send({ email: `updated${Date.now()}@test.com` });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for no update fields', async () => {
      const response = await request(BASE_URL)
        .patch(`/users/${testUserId}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /users/:id - Delete user', () => {

    it('should delete user successfully', async () => {
      expect(testUserId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/users/${testUserId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted user', async () => {
      const response = await request(BASE_URL).delete(`/users/${testUserId}`);
      expect(response.status).toBe(404);
    });
  });
});
