# 🚀 S-GROUP Tasks Management Backend 2024

## 🌟 Introduction

Welcome to the S-GROUP Tasks Management Backend, a robust and scalable backend solution designed to streamline task management processes for teams and organizations. Built with modern technologies and best practices, this backend ensures high performance and reliability.

## 💡 Motivation and Intentions

The primary motivation behind this project is to provide a seamless task management experience, enabling teams to collaborate effectively and manage their workflows efficiently. This backend aims to serve as the core infrastructure for task management applications, offering comprehensive APIs and database interactions to handle tasks, projects, users, and more.

## 🚀 Features

- **User Authentication & Authorization**: Secure user authentication and role-based access control.
- **Project Management**: Create, update, and manage projects and associated tasks.
- **Task Assignment**: Assign tasks to team members with due dates and priority levels.
- **Real-time Notifications**: Get real-time updates on task assignments, status changes, and deadlines.
- **Comprehensive API Documentation**: Easily integrate with the backend using well-documented APIs.

## 📚 Documentation

Comprehensive documentation is available to help you understand and work with this system:

- **[🏗️ Architecture Overview](docs/KUBERNETES_ARCHITECTURE.md)** - System architecture and component relationships
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions and procedures
- **[📖 API Documentation](docs/API.md)** - Detailed API reference with endpoints, authentication, and examples
- **[💻 Development Guide](docs/DEVELOPMENT.md)** - Development setup, testing, and best practices
- **[🧪 Testing Guide](docs/TESTING.md)** - Comprehensive testing strategies and examples
- **[🛡️ Security Guide](docs/SECURITY.md)** - Security practices, authentication, and protection measures
- **[⚡ Performance Guide](docs/PERFORMANCE.md)** - Performance optimization and monitoring

## 🛠️ Getting Started

### Step 1: 🚀 Initial Setup

- Clone the repository:
  ```bash
  git clone https://github.com/SgroupVN/task-management-be.git
  ```
- Navigate to the project directory:
  ```bash
  cd task-management-be
  ```
- Install dependencies:
  ```bash
  yarn
  ```

### Step 2: ⚙️ Environment Configuration

- Create a `.env` file by copying `.env.template`:
  ```bash
  cp .env.template .env
  ```
- Update the `.env` file with necessary environment variables.

### Step 3: 🏃‍♂️ Running the Project

- For development mode:
  ```bash
  yarn dev
  ```
- To build the project:
  ```bash
  yarn build
  ```
- For production mode:
  - Set `NODE_ENV="production"` in `.env`
  - Run:
    ```bash
    yarn build && yarn start
    ```

## 📁 Project Structure

```plaintext
.
├── api
│   ├── healthCheck
│   │   ├── __tests__
│   │   │   └── healthCheckRouter.test.ts
│   │   └── healthCheckRouter.ts
│   └── user
│       ├── __tests__
│       │   ├── userRouter.test.ts
│       │   └── userService.test.ts
│       ├── userModel.ts
│       ├── userRepository.ts
│       ├── userRouter.ts
│       └── userService.ts
├── api-docs
│   ├── __tests__
│   │   └── openAPIRouter.test.ts
│   ├── openAPIDocumentGenerator.ts
│   ├── openAPIResponseBuilders.ts
│   └── openAPIRouter.ts
├── common
│   ├── __tests__
│   │   ├── errorHandler.test.ts
│   │   └── requestLogger.test.ts
│   ├── entities
│   │   └── user.entity.ts
│   ├── middleware
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── requestLogger.ts
│   ├── migrations
│   │   └──
│   ├── models
│   │   └── serviceResponse.ts
│   └── utils
│       ├── commonValidation.ts
│       ├── envConfig.ts
│       └── httpHandlers.ts
├── index.ts
└── server.ts
```

🎉 Happy coding!
