# Course Selling App

This is a backend application for a course selling platform. It provides APIs for user and admin authentication, course management, and user course purchases.

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Database Models](#database-models)
8. [Error Handling](#error-handling)
9. [Token Revocation](#token-revocation)

## Features

- User and Admin authentication (signup, login, logout)
- Course creation and management by admins
- Course purchasing by users
- Token-based authentication with JWT
- Token revocation for logout functionality
- Input validation using Zod
- MongoDB integration for data storage

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Bcrypt for password hashing
- Zod for input validation
- Cors for handling Cross-Origin Resource Sharing

## Project Structure

```
.
├── config.js
├── index.js
├── isRevoked.js
├── package.json
├── .env
├── .gitignore
├── db-store
│   └── db.js
├── middlewares
│   ├── adminMiddleware.js
│   └── userMiddleware.js
└── routes
    ├── admin.js
    └── users.js
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET_USER=your_user_jwt_secret
   JWT_SECRET_ADMIN=your_admin_jwt_secret
   JWT_EXPIRY_USER=user_token_expiry_time
   JWT_EXPIRY_ADMIN=admin_token_expiry_time
   ```
4. Start the server:
   ```
   npm start
   ```
   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### User Routes

- POST `/api/v1/user/signup`: User registration
- POST `/api/v1/user/login`: User login
- POST `/api/v1/user/buy-course`: Purchase a course
- GET `/api/v1/user/my-courses`: Get user's purchased courses
- GET `/api/v1/user/courses`: Get all available courses
- POST `/api/v1/user/logout`: User logout

### Admin Routes

- POST `/api/v1/admin/signup`: Admin registration
- POST `/api/v1/admin/login`: Admin login
- POST `/api/v1/admin/make-course`: Create a new course
- PUT `/api/v1/admin/update-price`: Update course price
- POST `/api/v1/admin/add-instructor`: Add admin as course instructor
- GET `/api/v1/admin/my-courses`: Get admin's courses
- GET `/api/v1/admin/courses`: Get all courses
- POST `/api/v1/admin/logout`: Admin logout

## Authentication

The application uses JWT for authentication. After successful login, a token is provided which should be included in the `auth-key` header for protected routes.

## Database Models

- User: Stores user information and purchased courses
- Admin: Stores admin information and courses they instruct
- Course: Stores course details including instructors
- RevokedTokens: Stores revoked tokens for logout functionality

## Error Handling

The application includes error handling for various scenarios, including input validation, unauthorized access, and server errors.

## Token Revocation

The application implements token revocation for logout functionality. Revoked tokens are stored in the database and checked during authentication.
