# RBAC (Role-Based Access Control) for Trello-like App

This document explains how to use the Role-Based Access Control system implemented for the task management application.

## Overview

The RBAC system provides fine-grained access control with:

- **8 predefined roles** with different permission levels
- **40+ permissions** covering all aspects of a Trello-like application
- **Flexible authorization middleware** for protecting routes
- **Utility functions** for checking permissions in code

## Quick Start

### 1. Seed the Database

```bash
# Seed roles, permissions, and sample users
pnpm run seed:auth:up

# Clean up seeded data
pnpm run seed:auth:down
```

### 2. Basic Usage in Routes

```typescript
import { authenticateJWT } from '@/common/middleware/authentication';
import { authorize } from '@/common/middleware/authorization';
import { PERMISSIONS, ROLES } from '@/common/utils/rbacHelper';

// Only board members can create cards
router.post(
  '/cards',
  authenticateJWT,
  authorize({
    permissions: [PERMISSIONS.CARDS_CREATE],
    allowOwnership: true,
    ownershipField: 'boardId',
  }),
  createCard
);

// Only admins or workspace admins can delete boards
router.delete(
  '/boards/:id',
  authenticateJWT,
  authorize({
    roles: [ROLES.ADMIN, ROLES.WORKSPACE_ADMIN],
  }),
  deleteBoard
);
```

## Roles Hierarchy

### 1. **Admin** (System Administrator)

- **Level**: 100 (Highest)
- **Access**: Full system access
- **Use Case**: System administration, user management
- **Permissions**: All permissions

### 2. **Workspace Admin** (Workspace Administrator)

- **Level**: 80
- **Access**: Full workspace control
- **Use Case**: Managing organization workspaces
- **Permissions**: All workspace, board, and content permissions

### 3. **Board Owner** (Board Owner)

- **Level**: 60
- **Access**: Full control over owned boards
- **Use Case**: Board creators and owners
- **Permissions**: All board and content permissions

### 4. **Board Admin** (Board Administrator)

- **Level**: 50
- **Access**: Manage board content and members
- **Use Case**: Board moderators and managers
- **Permissions**: Board management, content creation/editing, member management

### 5. **Board Member** (Board Member)

- **Level**: 30
- **Access**: Create and edit content
- **Use Case**: Active team members
- **Permissions**: Content creation, editing own content, commenting

### 6. **Board Observer** (Board Observer)

- **Level**: 20
- **Access**: Read-only access
- **Use Case**: Stakeholders, viewers
- **Permissions**: View-only permissions

### 7. **User** (Regular User)

- **Level**: 10
- **Access**: Basic user capabilities
- **Use Case**: Regular users who can create their own boards
- **Permissions**: Create boards, manage own profile

### 8. **Guest** (Guest User)

- **Level**: 5 (Lowest)
- **Access**: Limited read access
- **Use Case**: External users with limited access
- **Permissions**: View specific boards they're invited to

## Permission Categories

### Board Permissions

- `boards:create` - Create new boards
- `boards:read` - View boards and their content
- `boards:update` - Edit board details and settings
- `boards:delete` - Delete boards
- `boards:manage` - Full board management

### List Permissions

- `lists:create` - Create new lists
- `lists:read` - View lists
- `lists:update` - Edit and reorder lists
- `lists:delete` - Delete lists
- `lists:archive` - Archive/unarchive lists

### Card Permissions

- `cards:create` - Create new cards
- `cards:read` - View cards
- `cards:update` - Edit card content
- `cards:delete` - Delete cards
- `cards:assign` - Assign members to cards
- `cards:move` - Move cards between lists
- `cards:archive` - Archive/unarchive cards

### Member Permissions

- `members:invite` - Invite new members
- `members:remove` - Remove members
- `members:read` - View board members
- `members:manage` - Manage member roles

## Authorization Middleware

### Basic Role Check

```typescript
import { requireRole, UserRole } from '@/common/middleware/authorization';

// Only admins
router.get('/admin/users', authenticateJWT, requireRole(UserRole.ADMIN), handler);

// Admins or managers
router.get('/reports', authenticateJWT, requireRole([UserRole.ADMIN, UserRole.MANAGER]), handler);
```

### Permission Check

```typescript
import { requirePermission } from '@/common/middleware/authorization';
import { PERMISSIONS } from '@/common/utils/rbacHelper';

// Requires specific permission
router.post('/boards', authenticateJWT, requirePermission(PERMISSIONS.BOARDS_CREATE), handler);

// Requires multiple permissions
router.put(
  '/cards/:id',
  authenticateJWT,
  requirePermission([PERMISSIONS.CARDS_UPDATE, PERMISSIONS.CARDS_ASSIGN]),
  handler
);
```

### Flexible Authorization

```typescript
import { authorize } from '@/common/middleware/authorization';

// Multiple authorization options
router.put(
  '/cards/:cardId',
  authenticateJWT,
  authorize({
    roles: [ROLES.ADMIN, ROLES.BOARD_ADMIN], // Admins or board admins
    permissions: [PERMISSIONS.CARDS_UPDATE], // OR users with update permission
    allowOwnership: true, // OR card creator
    ownershipField: 'cardId',
  }),
  updateCard
);
```

### Ownership-based Authorization

```typescript
import { requireOwnership } from '@/common/middleware/authorization';

// Users can only access their own resources
router.get('/profile/:userId', authenticateJWT, requireOwnership('userId'), getUserProfile);
```

## RBAC Helper Utility

### Check User Permissions

```typescript
import { RBACHelper, PERMISSIONS } from '@/common/utils/rbacHelper';

const rbac = new RBACHelper(dataSource);

// Check single permission
const canCreate = await rbac.userHasPermission(userId, PERMISSIONS.CARDS_CREATE);

// Check multiple permissions (any)
const canEdit = await rbac.userHasAnyPermission(userId, [PERMISSIONS.CARDS_UPDATE, PERMISSIONS.CARDS_DELETE]);

// Check multiple permissions (all)
const canFullyManage = await rbac.userHasAllPermissions(userId, [
  PERMISSIONS.CARDS_CREATE,
  PERMISSIONS.CARDS_UPDATE,
  PERMISSIONS.CARDS_DELETE,
]);
```

### Check User Roles

```typescript
// Check single role
const isAdmin = await rbac.userHasRole(userId, ROLES.ADMIN);

// Check multiple roles
const canManage = await rbac.userHasAnyRole(userId, [ROLES.ADMIN, ROLES.WORKSPACE_ADMIN, ROLES.BOARD_OWNER]);

// Check role hierarchy
const hasMinimumLevel = await rbac.userHasMinimumRoleLevel(userId, ROLES.BOARD_MEMBER);
```

### Resource Access Control

```typescript
// Check if user can access resource (ownership or permission)
const canAccess = await rbac.userCanAccessResource(userId, resourceOwnerId, [PERMISSIONS.BOARDS_READ]);
```

## Sample Users (Created by Seeder)

The seeder creates sample users for testing:

| Email                      | Password     | Role            | Description             |
| -------------------------- | ------------ | --------------- | ----------------------- |
| admin@trello.com           | admin123     | admin           | System administrator    |
| workspace.admin@trello.com | workspace123 | workspace_admin | Workspace administrator |
| board.owner@trello.com     | board123     | board_owner     | Board owner             |
| member@trello.com          | member123    | board_member    | Team member             |
| observer@trello.com        | observer123  | board_observer  | Read-only observer      |
| user@trello.com            | user123      | user            | Regular user            |
| guest@trello.com           | guest123     | guest           | Guest user              |

## Best Practices

### 1. **Use Constants**

Always use the provided constants instead of hardcoded strings:

```typescript
// Good ✅
authorize({ permissions: [PERMISSIONS.CARDS_CREATE] });

// Bad ❌
authorize({ permissions: ['cards:create'] });
```

### 2. **Combine Authorization Methods**

Use the flexible `authorize` middleware for complex scenarios:

```typescript
authorize({
  roles: [ROLES.ADMIN], // Admin access
  permissions: [PERMISSIONS.BOARDS_MANAGE], // OR permission-based
  allowOwnership: true, // OR resource owner
});
```

### 3. **Check Permissions in Business Logic**

Use RBAC helper for permission checks in services:

```typescript
export class BoardService {
  async updateBoard(userId: string, boardId: string, data: UpdateBoardData) {
    const rbac = new RBACHelper(this.dataSource);

    const canUpdate = await rbac.userCanAccessResource(userId, board.ownerId, [PERMISSIONS.BOARDS_UPDATE]);

    if (!canUpdate) {
      throw new ForbiddenError('Cannot update this board');
    }

    // Update board logic...
  }
}
```

### 4. **Use Role Hierarchy**

For hierarchical access control:

```typescript
// Allow access if user has minimum role level
const hasAccess = await rbac.userHasMinimumRoleLevel(userId, ROLES.BOARD_MEMBER);
```

## Database Schema

The RBAC system uses three main entities:

### Role Entity

```typescript
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  permissions: Permission[];
}
```

### Permission Entity

```typescript
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
```

### User Entity (Updated)

```typescript
@Entity('users')
export class User {
  // ... other fields

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  role: Role[];
}
```

This RBAC system provides a robust foundation for managing access control in your Trello-like application with fine-grained permissions and flexible authorization options.
