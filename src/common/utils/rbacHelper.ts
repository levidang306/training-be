import { DataSource } from 'typeorm';

import { Permission } from '@/common/entities/permission.entity';
import { Role } from '@/common/entities/role.entity';
import { User } from '@/common/entities/user.entity';

/**
 * RBAC Utility class to help with role and permission management
 */
export class RBACHelper {
  constructor(private dataSource: DataSource) {}

  /**
   * Get all permissions for a user based on their roles
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.role) {
      return [];
    }

    const permissions = new Set<string>();

    // Collect all permissions from all user roles
    user.role.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((permission) => {
          permissions.add(permission.name);
        });
      }
    });

    return Array.from(permissions);
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionName);
  }

  /**
   * Check if user has any of the required permissions
   */
  async userHasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissionNames.some((permission) => userPermissions.includes(permission));
  }

  /**
   * Check if user has all required permissions
   */
  async userHasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissionNames.every((permission) => userPermissions.includes(permission));
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.map((role) => role.name);
  }

  /**
   * Check if user has specific role
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName);
  }

  /**
   * Check if user has any of the required roles
   */
  async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return roleNames.some((role) => userRoles.includes(role));
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<boolean> {
    const userRepository = this.dataSource.getRepository(User);
    const roleRepository = this.dataSource.getRepository(Role);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    const role = await roleRepository.findOne({
      where: { name: roleName },
    });

    if (!user || !role) {
      return false;
    }

    // Check if user already has this role
    const hasRole = user.role.some((r) => r.id === role.id);
    if (hasRole) {
      return true; // Already has role
    }

    user.role.push(role);
    await userRepository.save(user);
    return true;
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<boolean> {
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      return false;
    }

    const initialLength = user.role.length;
    user.role = user.role.filter((role) => role.name !== roleName);

    if (user.role.length < initialLength) {
      await userRepository.save(user);
      return true;
    }

    return false; // Role not found
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    const roleRepository = this.dataSource.getRepository(Role);
    return roleRepository.find({
      relations: ['permissions'],
    });
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const permissionRepository = this.dataSource.getRepository(Permission);
    return permissionRepository.find();
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleName: string): Promise<string[]> {
    const roleRepository = this.dataSource.getRepository(Role);

    const role = await roleRepository.findOne({
      where: { name: roleName },
      relations: ['permissions'],
    });

    if (!role || !role.permissions) {
      return [];
    }

    return role.permissions.map((permission) => permission.name);
  }

  /**
   * Check if user can perform action on resource
   * This is useful for checking ownership-based permissions
   */
  async userCanAccessResource(
    userId: string,
    resourceOwnerId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    // If user is the owner, allow access
    if (userId === resourceOwnerId) {
      return true;
    }

    // Check if user has required permissions
    return this.userHasAnyPermission(userId, requiredPermissions);
  }

  /**
   * Get hierarchy level for role (useful for role-based hierarchies)
   */
  getRoleHierarchy(roleName: string): number {
    const hierarchy: { [key: string]: number } = {
      admin: 100,
      workspace_admin: 80,
      board_owner: 60,
      board_admin: 50,
      board_member: 30,
      board_observer: 20,
      user: 10,
      guest: 5,
    };

    return hierarchy[roleName] || 0;
  }

  /**
   * Check if user has higher or equal role hierarchy than required
   */
  async userHasMinimumRoleLevel(userId: string, minimumRole: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const minimumLevel = this.getRoleHierarchy(minimumRole);

    return userRoles.some((role) => this.getRoleHierarchy(role) >= minimumLevel);
  }
}

// Export commonly used permission constants
export const PERMISSIONS = {
  // Board permissions
  BOARDS_CREATE: 'boards:create',
  BOARDS_READ: 'boards:read',
  BOARDS_UPDATE: 'boards:update',
  BOARDS_DELETE: 'boards:delete',
  BOARDS_MANAGE: 'boards:manage',

  // List permissions
  LISTS_CREATE: 'lists:create',
  LISTS_READ: 'lists:read',
  LISTS_UPDATE: 'lists:update',
  LISTS_DELETE: 'lists:delete',
  LISTS_ARCHIVE: 'lists:archive',

  // Card permissions
  CARDS_CREATE: 'cards:create',
  CARDS_READ: 'cards:read',
  CARDS_UPDATE: 'cards:update',
  CARDS_DELETE: 'cards:delete',
  CARDS_ASSIGN: 'cards:assign',
  CARDS_MOVE: 'cards:move',
  CARDS_ARCHIVE: 'cards:archive',

  // Member permissions
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_READ: 'members:read',
  MEMBERS_MANAGE: 'members:manage',

  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  USERS_MANAGE: 'users:manage',
  WORKSPACES_MANAGE: 'workspaces:manage',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  WORKSPACE_ADMIN: 'workspace_admin',
  BOARD_OWNER: 'board_owner',
  BOARD_ADMIN: 'board_admin',
  BOARD_MEMBER: 'board_member',
  BOARD_OBSERVER: 'board_observer',
  USER: 'user',
  GUEST: 'guest',
} as const;

export default RBACHelper;
