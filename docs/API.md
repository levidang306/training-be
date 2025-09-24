# 📡 API Documentation

## 🌟 Overview

The Task Management Backend provides a RESTful API for managing users, authentication, and task-related operations. The API is built with Express.js, TypeScript, and follows OpenAPI 3.0 specifications.

## 🔗 Base URLs

- **Local Development**: `http://localhost:8080`
- **Docker**: `http://localhost:8080`
- **Kubernetes (NodePort)**: `http://localhost:30080`
- **Kubernetes (Port-forward)**: `http://localhost:8080`
- **Production**: `https://task-management-api.example.com`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Expires In**: 1 day (configurable via `JWT_EXPIRES_IN`)
- **Refresh**: Re-authenticate when token expires
- **Storage**: Store securely on client-side (localStorage/sessionStorage)

## 📋 API Endpoints

### 🏥 Health Check

#### Get Health Status
```http
GET /health-check
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "responseObject": null,
  "statusCode": 200
}
```

---

### 🔐 Authentication Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "responseObject": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false,
      "createdAt": "2025-09-24T07:25:17.229Z",
      "updatedAt": "2025-09-24T07:25:17.229Z"
    }
  },
  "statusCode": 201
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Minimum 6 characters
- FirstName: Required, string
- LastName: Required, string

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "responseObject": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": true
    }
  },
  "statusCode": 200
}
```

#### Verify Email
```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "token": "email-verification-token"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "responseObject": null,
  "statusCode": 200
}
```

#### Resend Verification Email
```http
POST /auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### 👤 User Endpoints

#### Get User Profile
```http
GET /user/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "responseObject": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": true,
    "createdAt": "2025-09-24T07:25:17.229Z",
    "updatedAt": "2025-09-24T07:25:17.229Z"
  },
  "statusCode": 200
}
```

#### Update User Profile
```http
PUT /user/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

---

## 📊 Response Format

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "message": string,
  "responseObject": any | null,
  "statusCode": number
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "responseObject": { /* data */ },
  "statusCode": 200
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Validation error",
  "responseObject": {
    "errors": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "statusCode": 400
}
```

## 🔢 HTTP Status Codes

| Code | Description | Use Case |
|------|-------------|----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 422 | Unprocessable Entity | Invalid data format |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |

## 🛡️ Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 20 per window per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets

## 🔒 Security Headers

The API includes security headers in all responses:

- `Content-Security-Policy`: XSS protection
- `X-Frame-Options`: Clickjacking protection
- `X-Content-Type-Options`: MIME sniffing protection
- `Strict-Transport-Security`: HTTPS enforcement
- `X-XSS-Protection`: Legacy XSS protection

## 📝 Request/Response Examples

### cURL Examples

#### Register
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:8080/user/profile \
  -H "Authorization: Bearer your-jwt-token-here"
```

### JavaScript/Fetch Examples

#### Register
```javascript
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:8080/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  return await response.json();
};

// Usage
const result = await registerUser({
  email: 'john@example.com',
  password: 'securePass123',
  firstName: 'John',
  lastName: 'Doe'
});
```

#### Authenticated Request
```javascript
const getProfile = async (token) => {
  const response = await fetch('http://localhost:8080/user/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

## 🐛 Error Handling

### Common Error Scenarios

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "responseObject": {
    "errors": [
      {
        "field": "email",
        "message": "Email must be a valid email address"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters long"
      }
    ]
  },
  "statusCode": 400
}
```

#### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "responseObject": null,
  "statusCode": 401
}
```

#### Resource Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "responseObject": null,
  "statusCode": 404
}
```

## 📖 OpenAPI/Swagger Documentation

Interactive API documentation is available at:
- **Local**: http://localhost:8080/docs
- **Production**: https://task-management-api.example.com/docs

The Swagger UI provides:
- Interactive endpoint testing
- Request/response schemas
- Authentication testing
- Example requests and responses

## 🧪 Testing the API

### Using Postman
1. Import the OpenAPI spec from `/docs/json`
2. Set up environment variables for base URL and tokens
3. Test authentication flow first
4. Use returned JWT token for authenticated endpoints

### Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create a new collection
3. Add requests for each endpoint
4. Set up authentication headers

### Using Browser Developer Tools
```javascript
// In browser console
fetch('http://localhost:8080/health-check')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🔄 API Versioning

Current API version: **v1**

Future versions will be available at:
- `/api/v2/auth/login`
- `/api/v2/user/profile`

Version information is included in response headers:
- `API-Version: v1`

## 📈 Performance Considerations

- **Response Time**: < 200ms for most endpoints
- **Database Queries**: Optimized with indexes
- **Caching**: Response caching for static data
- **Compression**: Gzip compression enabled
- **Rate Limiting**: Prevents API abuse

## 🌐 CORS Configuration

CORS is configured to allow:
- **Origins**: `http://localhost:3000` (development), production domains
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Authorization, Content-Type, Accept
- **Credentials**: Enabled for authentication

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [JWT.io Debugger](https://jwt.io/)
- [Postman Documentation](https://learning.postman.com/docs/)
- [REST API Best Practices](https://restfulapi.net/)