# Authorization Middleware Usage Guide

## Overview

The updated authorization middleware now queries the database to check user roles and permissions in real-time. This ensures that any changes to user permissions are immediately reflected without requiring a logout/login cycle.

## Key Features

- **Database-driven**: Queries database for current user roles and permissions
- **Real-time updates**: Permission changes take effect immediately
- **Flexible authorization**: Multiple authorization strategies
- **TypeScript support**: Full type safety
- **Error handling**: Comprehensive error responses

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
JWT_SECRET=your-super-secure-jwt-secret-key
```

### 2. Required Dependencies

Make sure these packages are installed:

```bash
pnpm add jsonwebtoken bcryptjs
pnpm add -D @types/jsonwebtoken @types/bcryptjs
```

## Basic Usage

### 1. Authentication Middleware

First, you need JWT authentication to identify the user:

```typescript
import { authenticateJWT } from '@/middleware/auth';
import { loadUserRoles, requirePermission } from '@/common/middleware/authorization';

// Apply to all protected routes
app.use('/api/protected', authenticateJWT, loadUserRoles);
```

### 2. Role-Based Authorization

```typescript
// Only admins can access
router.get('/admin-panel', requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin panel' });
});

// Multiple roles allowed
router.get('/management', requireRole(['admin', 'workspace_admin', 'board_owner']), (req, res) => {
  res.json({ message: 'Management interface' });
});
```

### 3. Permission-Based Authorization

```typescript
// Single permission
router.post('/boards', requirePermission('boards:create'), (req, res) => {
  // Create board logic
});

// Multiple permissions required
router.put('/boards/:id/settings', requirePermission(['boards:update', 'boards:manage']), (req, res) => {
  // Update board settings
});
```

### 4. Combined Role and Permission Checks

```typescript
router.delete('/boards/:id', requireRoleAndPermission(['admin', 'board_owner'], ['boards:delete']), (req, res) => {
  // Delete board logic
});
```

### 5. Resource Ownership

```typescript
// Users can only access their own profile
router.get('/users/:userId/profile', requireOwnership('userId'), (req, res) => {
  // Profile logic
});
```

### 6. Flexible Authorization

```typescript
// Most flexible - multiple conditions
router.get(
  '/cards/:cardId',
  authorize({
    roles: ['admin'], // OR has admin role
    permissions: ['cards:read'], // OR has permission
    allowOwnership: true, // OR owns the resource
    ownershipField: 'createdBy',
  }),
  (req, res) => {
    // Card details logic
  }
);
```

## Complete Example

```typescript
import express from 'express';
import { authenticateJWT, loadUserRoles, requirePermission, requireRole, authorize } from '@/middleware';

const router = express.Router();

// Public route - no auth needed
router.get('/public-boards', (req, res) => {
  res.json({ boards: [] });
});

// Apply authentication to all routes below
router.use(authenticateJWT);
router.use(loadUserRoles);

// Protected routes
router.get('/boards', requirePermission('boards:read'), async (req, res) => {
  // Fetch boards user can see
  res.json({ boards: [], user: req.user });
});

router.post('/boards', requirePermission('boards:create'), async (req, res) => {
  // Create new board
  res.json({ message: 'Board created' });
});

router.put(
  '/boards/:id',
  authorize({
    permissions: ['boards:update'],
    allowOwnership: true,
    ownershipField: 'ownerId',
  }),
  async (req, res) => {
    // Update board
    res.json({ message: 'Board updated' });
  }
);

router.delete('/boards/:id', requireRole(['admin', 'board_owner']), async (req, res) => {
  // Delete board
  res.json({ message: 'Board deleted' });
});

export default router;
```

## Testing with Sample Users

Login with any of the seeded users to test different permission levels:

```bash
# Admin user - full access
POST /api/auth/login
{
  "email": "admin@trello.com",
  "password": "admin123"
}

# Board member - limited access
POST /api/auth/login
{
  "email": "member@trello.com",
  "password": "member123"
}

# Guest user - very limited access
POST /api/auth/login
{
  "email": "guest@trello.com",
  "password": "guest123"
}
```

## Error Responses

The middleware returns standardized error responses:

```typescript
// 401 - Authentication required
{
  "success": false,
  "message": "Authentication required"
}

// 403 - Insufficient permissions
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["boards:create"],
  "current": ["boards:read", "cards:read"]
}

// 403 - Insufficient role
{
  "success": false,
  "message": "Insufficient role privileges",
  "required": ["admin", "board_owner"],
  "current": ["board_member"]
}
```

## Performance Considerations

- The middleware caches user permissions during the request lifecycle
- Database queries are optimized with proper relations
- Consider implementing caching for frequently accessed permissions
- The `loadUserRoles` middleware should be called once per request

## Best Practices

1. **Always use `loadUserRoles` after authentication**
2. **Use specific permissions rather than broad roles when possible**
3. **Implement resource ownership checks for user-generated content**
4. **Use the `authorize` function for complex authorization logic**
5. **Handle errors gracefully with proper HTTP status codes**
6. **Log authorization failures for security monitoring**

## Available Permissions

The seeded permissions include:

- **Boards**: `boards:create`, `boards:read`, `boards:update`, `boards:delete`, `boards:manage`
- **Lists**: `lists:create`, `lists:read`, `lists:update`, `lists:delete`, `lists:archive`
- **Cards**: `cards:create`, `cards:read`, `cards:update`, `cards:delete`, `cards:assign`, `cards:move`, `cards:archive`
- **Comments**: `comments:create`, `comments:read`, `comments:update`, `comments:delete`, `comments:moderate`
- **Members**: `members:invite`, `members:remove`, `members:read`, `members:manage`
- **And many more...**

## Available Roles

Roles in hierarchical order (highest to lowest):

1. **admin** (51 permissions) - System administrator
2. **workspace_admin** (47 permissions) - Workspace management
3. **board_owner** (41 permissions) - Board ownership
4. **board_admin** (37 permissions) - Board administration
5. **board_member** (29 permissions) - Board collaboration
6. **board_observer** (11 permissions) - Read-only access
7. **user** (8 permissions) - Basic user
8. **guest** (9 permissions) - Limited guest access
