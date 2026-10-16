# COMP3123 Assignment 1 - Secure RESTful API

**Student Number:** 101346000  
**Course:** COMP3123 - Full Stack Development  
**Assignment:** Backend API Development (10%)  
**Due Date:** October 18, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Environment Variables](#environment-variables)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Security Features](#security-features)
9. [Logging](#logging)
10. [Health Check](#health-check)
11. [Testing with Postman](#testing-with-postman)

---

## Project Overview

This is a secure RESTful API built with Node.js, Express, and MongoDB. The application provides:

- **User Management**: Registration and authentication with JWT
- **Employee Management**: Full CRUD operations
- **Data Ownership**: Users can only access their own employees
- **Security**: Password hashing, rate limiting, input validation, and Helmet

### Key Features

- ✅ User signup and login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Employee CRUD operations
- ✅ User-Employee relationship (data ownership)
- ✅ Input validation with express-validator
- ✅ Rate limiting to prevent abuse
- ✅ Security headers with Helmet
- ✅ Centralized error handling
- ✅ Local file logging with Winston
- ✅ Health check endpoint

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| MongoDB | NoSQL database |
| Mongoose | MongoDB ODM |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Helmet | Security HTTP headers |
| express-rate-limit | API rate limiting |
| express-validator | Input validation |
| Winston | Logging |
| dotenv | Environment variables |

---

## Project Structure

```
101346000_COMP3123_Assignment1/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── userController.js   # User signup/login logic
│   └── employeeController.js # Employee CRUD logic
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── errorHandler.js    # Centralized error handling
├── models/
│   ├── User.js            # User schema
│   └── Employee.js        # Employee schema
├── routes/
│   ├── userRoutes.js      # User API routes
│   └── employeeRoutes.js  # Employee API routes
├── validators/
│   ├── userValidator.js   # User input validation
│   └── employeeValidator.js # Employee input validation
├── utils/
│   └── logger.js          # Winston logger configuration
├── logs/
│   └── *.log              # Log files
├── server.js              # Application entry point
├── package.json
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
├── .gitignore
└── README.md
```

---

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Postman (for testing)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/101346000_COMP3123_Assignment1.git
cd 101346000_COMP3123_Assignment1
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/comp3123_assignment1
JWT_SECRET=your_secure_secret_key
JWT_EXPIRES_IN=24h
```

### Step 4: Start MongoDB

If using local MongoDB:
```bash
mongod
```

If using MongoDB Atlas, update `MONGODB_URI` in `.env`.

### Step 5: Start the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Step 6: Test the API

The API will be running at `http://localhost:3000`

- Root: `GET http://localhost:3000/`
- Health check: `GET http://localhost:3000/health`

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/comp3123_assignment1` |
| `JWT_SECRET` | Secret key for JWT signing | `your_super_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `AUTH_RATE_LIMIT_MAX` | Max auth attempts per window | `5` |

**⚠️ Never commit your actual `.env` file to GitHub!**

---

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

Live API: `https://comp3123-assignment1-101346000.vercel.app/api/v1`

### General Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API welcome / available routes | No |
| GET | `/health` | Health check | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/user/signup` | Register new user | No |
| POST | `/user/login` | Authenticate user | No |

### Employee Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/emp/employees` | Get all employees | Yes |
| POST | `/emp/employees` | Create employee | Yes |
| GET | `/emp/employees/:eid` | Get employee by ID | Yes |
| PUT | `/emp/employees/:eid` | Update employee | Yes |
| DELETE | `/emp/employees?eid=xxx` | Delete employee | Yes |

---

### Detailed Endpoint Documentation

#### 1. POST /api/v1/user/signup

Register a new user.

**Request Body:**
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123"
}
```

**Success Response (201):**
```json
{
    "status": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "_id": "...",
            "username": "johndoe",
            "email": "john@example.com",
            "created_at": "..."
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - User already exists

---

#### 2. POST /api/v1/user/login

Authenticate a user.

**Request Body (using email):**
```json
{
    "email": "john@example.com",
    "password": "Password123"
}
```

**Request Body (using username):**
```json
{
    "username": "johndoe",
    "password": "Password123"
}
```

**Success Response (200):**
```json
{
    "status": true,
    "message": "Login successful",
    "data": {
        "user": {
            "_id": "...",
            "username": "johndoe",
            "email": "john@example.com"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `429` - Too many attempts (rate limited)

---

#### 3. GET /api/v1/emp/employees

Get all employees belonging to authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
    "status": true,
    "message": "Employees retrieved successfully",
    "data": [
        {
            "_id": "...",
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@company.com",
            "position": "Developer",
            "salary": 75000,
            "date_of_joining": "2024-01-15T00:00:00.000Z",
            "department": "Engineering",
            "user": "...",
            "created_at": "...",
            "updated_at": "..."
        }
    ]
}
```

---

#### 4. POST /api/v1/emp/employees

Create a new employee.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@company.com",
    "position": "Developer",
    "salary": 75000,
    "date_of_joining": "2024-01-15",
    "department": "Engineering"
}
```

**Success Response (201):**
```json
{
    "status": true,
    "message": "Employee created successfully",
    "data": {
        "_id": "...",
        "first_name": "Jane",
        "last_name": "Smith",
        ...
    }
}
```

---

#### 5. GET /api/v1/emp/employees/:eid

Get a specific employee by ID.

**Success Response (200):**
```json
{
    "status": true,
    "message": "Employee retrieved successfully",
    "data": { ... }
}
```

**Error Responses:**
- `404` - Employee not found (or belongs to another user)

---

#### 6. PUT /api/v1/emp/employees/:eid

Update an employee.

**Request Body (partial update allowed):**
```json
{
    "salary": 80000,
    "position": "Senior Developer"
}
```

**Success Response (200):**
```json
{
    "status": true,
    "message": "Employee updated successfully",
    "data": { ... }
}
```

---

#### 7. DELETE /api/v1/emp/employees?eid=xxx

Delete an employee.

**Success Response (204):**
No content returned.

---

## Authentication & Authorization

### How JWT Authentication Works

1. **User signs up or logs in** → Server generates JWT token
2. **Client stores token** (e.g., localStorage)
3. **Client sends token** with each request:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. **Server verifies token** → Extracts user ID
5. **Server processes request** with authenticated user context

### Token Structure

JWT contains three parts:
- **Header**: Algorithm and type
- **Payload**: User ID and expiration
- **Signature**: Verification hash

### Authorization (Data Ownership)

**Critical Security Feature:**

Each employee is linked to the user who created them via the `user` field in the Employee model. This ensures:

- User A can **only** see employees they created
- User A **cannot** access, update, or delete User B's employees
- Ownership is verified on **every** employee operation

**How it works:**
```javascript
// All employee queries include user filter
const employees = await Employee.find({ user: req.user._id });
```

---

## Security Features

### 1. Password Hashing (bcrypt)

**What it does:** Converts passwords into irreversible hashes before storing in database.

**Why it's needed:** If database is compromised, attackers only get hashes, not actual passwords.

**Implementation:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

---

### 2. Helmet (Security Headers)

**What it does:** Adds HTTP security headers to responses.

**Headers added:**
- `X-Content-Type-Options`: Prevents MIME-sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Enables browser XSS filter
- `Strict-Transport-Security`: Forces HTTPS

---

### 3. Rate Limiting

**What it does:** Limits the number of requests from a single IP address.

**Endpoints protected:**
- `/api/v1/user/login` - 5 attempts per 15 minutes
- `/api/v1/user/signup` - 5 attempts per 15 minutes
- All `/api/*` routes - 100 requests per 15 minutes

**What happens when exceeded:**
```json
{
    "status": false,
    "message": "Too many requests, please try again later"
}
```
HTTP Status: `429 Too Many Requests`

---

### 4. Input Validation

All user input is validated before processing:

**User validation:**
- Username: 3-30 characters, alphanumeric
- Email: Valid email format
- Password: Min 6 characters, at least one letter and number

**Employee validation:**
- Required fields: first_name, last_name, email, position, salary, date_of_joining, department
- Email: Valid format
- Salary: Must be a positive number
- Date: Valid ISO date format

---

### 5. Environment Variables

Sensitive data is stored in environment variables, **never** in code:
- Database credentials
- JWT secret
- API keys

---

## Logging

### Where Logs Are Stored

```
logs/
├── combined.log    # All log entries
├── error.log       # Error entries only
└── sample.log      # Example log file
```

### What Is Logged

- ✅ Server startup events
- ✅ HTTP requests (method, URL, status, response time)
- ✅ Authentication events (login success/failure)
- ✅ User operations (signup, employee CRUD)
- ✅ Validation failures
- ✅ Authorization failures
- ✅ Application errors

### What Is NOT Logged (Security)

- ❌ Passwords
- ❌ JWT tokens
- ❌ Database credentials
- ❌ Full request bodies containing sensitive data

### Log Format

```
2024-10-15 10:30:00 [INFO]: Server running in development mode on port 3000
2024-10-15 10:31:15 [INFO]: POST /api/v1/user/signup 201 125ms
2024-10-15 10:31:15 [INFO]: New user registered: johndoe (john@example.com)
2024-10-15 10:32:00 [WARN]: Login failed: Invalid password for user johndoe
```

---

## Health Check

### Root endpoint

```
GET /
```

Returns a short JSON summary of the API so opening the deployed URL in a browser does not look like an error.

```json
{
    "status": true,
    "message": "COMP3123 Assignment 1 API",
    "student": "101346000",
    "health": "/health",
    "endpoints": {
        "signup": "POST /api/v1/user/signup",
        "login": "POST /api/v1/user/login",
        "employees": "/api/v1/emp/employees"
    }
}
```

### Health endpoint

```
GET /health
```

### Response

```json
{
    "status": true,
    "message": "API is healthy",
    "timestamp": "2024-10-15T14:30:00.000Z",
    "environment": "development",
    "uptime": 3600.5
}
```

### Purpose

- Verify API is running
- Used by monitoring tools
- Check server uptime

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Import > File > Select `COMP3123_Assignment1.postman_collection.json`

### Test Scenarios

#### Successful Operations
1. User signup
2. User login (email)
3. User login (username)
4. Create employee
5. Get all employees
6. Get employee by ID
7. Update employee
8. Delete employee

#### Error Scenarios
1. Duplicate user registration
2. Invalid login credentials
3. Missing JWT token
4. Invalid JWT token
5. Invalid employee ID
6. Validation errors
7. Accessing another user's employee
8. Rate limit exceeded

### Two-User Authorization Test

1. **Create User A** and login
2. **Create employees** for User A
3. **Create User B** and login
4. **Try to access** User A's employees with User B's token
5. **Verify** 404 response (access denied)

---

## HTTP Status Codes Used

| Code | Name | When Used |
|------|------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (signup, create employee) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (user exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Sample Test Credentials

For testing/marking purposes:

**User A:**
```
Username: testuser1
Email: test1@example.com
Password: Test1234
```

**User B:**
```
Username: testuser2
Email: test2@example.com
Password: Test1234
```

---

## Deployment (Vercel)

This Express API is deployed to [Vercel](https://vercel.com/guides/using-express-with-vercel). Vercel imports `server.js` as a serverless function.

### Environment variables on Vercel

Add these in the Vercel project settings (do not commit `.env`):

```
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN=24h
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

MongoDB Atlas must allow connections from anywhere (`0.0.0.0/0`) so Vercel can reach the database.

**Live URL:** https://comp3123-assignment1-101346000.vercel.app

- Root: https://comp3123-assignment1-101346000.vercel.app/
- Health check: https://comp3123-assignment1-101346000.vercel.app/health
- Signup: `POST https://comp3123-assignment1-101346000.vercel.app/api/v1/user/signup`

---

## Author

**Student Number:** 101346000  
**Course:** COMP3123 - Full Stack Development  
**Instructor:** Pritesh Patel

---

## License

This project is submitted as academic coursework for COMP3123 at George Brown College.
