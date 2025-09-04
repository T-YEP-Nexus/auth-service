const request = require("supertest");
const supabase = require("../config/supabaseClient.js");
const bcrypt = require("bcrypt");

const BASE_URL = "http://localhost:3001";

let testUserId = null;
let testUserEmail = null;
let authToken = null;
let testUserProfileId = null;
let testUserCredentials = null;
let mainTestUserId = null;
let mainTestUserProfileId = null;
// Helper function to create a test user with profile
async function createTestUser() {
  const testUser = {
    email: `testuser${Date.now()}@test.com`,
    password: "testpassword123",
  };

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

  // Create user in database
  const { data: user, error: userError } = await supabase
    .from("user")
    .insert([
      {
        email: testUser.email,
        password: hashedPassword,
      },
    ])
    .select()
    .single();

  if (userError) {
    throw new Error(`Failed to create test user: ${userError.message}`);
  }

  // Create user profile
  const { data: profile, error: profileError } = await supabase
    .from("user-profile")
    .insert([
      {
        id_user: user.id,
        roles_user: "admin", // Use admin role for testing
      },
    ])
    .select()
    .single();

  if (profileError) {
    // Clean up user if profile creation fails
    await supabase.from("user").delete().eq("id", user.id);
    throw new Error(
      `Failed to create test user profile: ${profileError.message}`
    );
  }

  return {
    user,
    profile,
    credentials: testUser,
  };
}

// Helper function to delete test user and profile
async function deleteTestUser(userId, profileId) {
  if (profileId) {
    await supabase.from("user-profile").delete().eq("id", profileId);
  }
  if (userId) {
    await supabase.from("user").delete().eq("id", userId);
  }
}

// Helper function to get authentication token
async function getAuthToken(credentials) {
  const loginResponse = await request(BASE_URL)
    .post("/login")
    .send(credentials);

  if (loginResponse.status === 200 && loginResponse.body.success) {
    return loginResponse.body.data.token;
  }

  throw new Error("Failed to get authentication token");
}

describe("User CRUD Routes (Integration)", () => {
  // Setup: Create test user and get authentication token before running tests
  beforeAll(async () => {
    try {
      // Create test user with profile
      const testUserData = await createTestUser();
      mainTestUserId = testUserData.user.id;
      mainTestUserProfileId = testUserData.profile.id;
      testUserCredentials = testUserData.credentials;

      // Get authentication token
      authToken = await getAuthToken(testUserCredentials);
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the main test user
      await deleteTestUser(mainTestUserId, mainTestUserProfileId);
    } catch (error) {
      console.error("Failed to cleanup test user:", error);
    }
  });

  describe("Authentication Tests", () => {
    it("should reject requests without token", async () => {
      const response = await request(BASE_URL).get("/users");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with invalid token format", async () => {
      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", "InvalidToken");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with malformed Bearer token", async () => {
      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", "Bearer invalid-token-format");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with expired token", async () => {
      // Create an expired token (this is a mock expired token)
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid";

      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", `Bearer ${expiredToken}`);
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with token missing Bearer prefix", async () => {
      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", authToken);
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should accept requests with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject all protected routes without token", async () => {
      const protectedRoutes = [
        { method: "GET", path: "/users" },
        { method: "GET", path: "/users/123e4567-e89b-12d3-a456-426614174000" },
        { method: "GET", path: "/users/email/test@test.com" },
        {
          method: "PATCH",
          path: "/users/123e4567-e89b-12d3-a456-426614174000",
        },
        {
          method: "DELETE",
          path: "/users/123e4567-e89b-12d3-a456-426614174000",
        },
      ];

      for (const route of protectedRoutes) {
        const response = await request(BASE_URL)[route.method.toLowerCase()](
          route.path
        );
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Unauthorized");
      }
    });

    it("should allow POST /users without token (registration)", async () => {
      const newUser = {
        email: `registrationtest${Date.now()}@test.com`,
        password: "password123",
      };

      const response = await request(BASE_URL).post("/users").send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);

      // Clean up the created user
      await supabase.from("user").delete().eq("id", response.body.data.id);
    });

    it("should allow POST /login without token", async () => {
      const response = await request(BASE_URL).post("/login").send({
        email: "nonexistent@test.com",
        password: "wrongpassword",
      });

      // Should return 401 for invalid credentials, not for missing token
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid email or password");
    });
  });

  describe("GET /users - Get all users", () => {
    it("should return all users successfully", async () => {
      const response = await request(BASE_URL)
        .get("/users")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("POST /users - Create new user", () => {
    it("should create user successfully", async () => {
      const newUser = {
        email: `user${Date.now()}@test.com`,
        password: "password123",
      };

      const response = await request(BASE_URL)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newUser);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);

      // Store the created user ID for other tests
      testUserId = response.body.data.id;
      testUserEmail = newUser.email;
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "test@test.com" });
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(BASE_URL)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "bademail", password: "password123" });
      expect(response.status).toBe(400);
    });
  });

  describe("GET /users/:id - Get user by ID", () => {
    it("should return user by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
    });

    it("should return 400 for invalid UUID format", async () => {
      const response = await request(BASE_URL)
        .get("/users/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(BASE_URL)
        .get("/users/6f4bfc69-0244-4d27-8912-73213f161f12")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /users/email/:email - Get user by email", () => {
    it("should return user by valid email", async () => {
      const response = await request(BASE_URL)
        .get(`/users/email/${testUserEmail}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUserEmail);
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(BASE_URL)
        .get("/users/email/invalid-email")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent email", async () => {
      const response = await request(BASE_URL)
        .get("/users/email/nonexistentuser@test.com")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /users/:id - Update user", () => {
    it("should update user email successfully", async () => {
      expect(testUserId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: `updated${Date.now()}@test.com` });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for no update fields", async () => {
      const response = await request(BASE_URL)
        .patch(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /users/:id - Delete user", () => {
    it("should delete user successfully", async () => {
      expect(testUserId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted user", async () => {
      const response = await request(BASE_URL)
        .delete(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
