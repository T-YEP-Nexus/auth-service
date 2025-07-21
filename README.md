# Auth Microservice

This microservice manages user authentication and user accounts. It provides CRUD operations for users, as well as login and logout functionality with JWT-based authentication.

---

## API Routes

| Method | Endpoint           | Description                       |
|--------|--------------------|---------------------------------|
| GET    | `/users`           | Retrieve all users               |
| GET    | `/users/:id`       | Retrieve a user by ID            |
| POST   | `/users`           | Create a new user (sign up)      |
| PATCH  | `/users/:id`       | Update user email and/or password|
| DELETE | `/users/:id`       | Delete a user                   |
| POST   | `/login`           | Login user and receive JWT token |
| POST   | `/logout`          | Logout user by invalidating token|

---

## API Description

This API allows full management of user accounts:

- **User creation** validates email and password format, hashes passwords before saving.
- **User retrieval** supports fetching all users or single user by UUID.
- **User updates** allow email and password changes with validation and uniqueness checks.
- **User deletion** requires a valid UUID.
- **Login** validates credentials, returns a JWT token for authentication.
- **Logout** validates the token and invalidates the session (no token storage).

---

## Swagger Documentation

Access the complete API documentation and test endpoints here:

**[Auth Microservice Swagger Documentation](http://localhost:3001/api-docs)**
