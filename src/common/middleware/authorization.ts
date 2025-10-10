import { NextFunction, Request, Response } from 'express';

import { User } from '@/common/entities/user.entity';
import AppDataSource from '@/configs/typeorm.config';

// Interface for authenticated request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    [key: string]: any;
  };
}

// Helper function to check if user has specific role
function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role);
}

// Helper function to check if user has any of the specified roles
function hasAnyRole(userRoles: string[], roles: string[]): boolean {
  return roles.some((role) => userRoles.includes(role));
}

// Helper function to check if user has all specified permissions
function hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
  return permissions.every((permission) => userPermissions.includes(permission));
}

// Helper function to load user with roles and permissions from database
async function loadUserPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] } | null> {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.role) {
      return null;
    }

    const roles = user.role.map((role) => role.name);
    const permissions = user.role.flatMap((role) =>
      role.permissions ? role.permissions.map((permission) => permission.name) : []
    );

    // Remove duplicates
    const uniquePermissions = [...new Set(permissions)];

    return {
      roles,
      permissions: uniquePermissions,
    };
  } catch (error) {
    console.error('Error loading user permissions:', error);
    return null;
  }
}

// Middleware to load user roles and permissions into request
export const loadUserRoles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.userId) {
    return next();
  }

  try {
    const userPermissions = await loadUserPermissions(req.user.userId);

    if (userPermissions) {
      req.user.roles = userPermissions.roles;
      req.user.permissions = userPermissions.permissions;
    } else {
      req.user.roles = [];
      req.user.permissions = [];
    }
  } catch (error) {
    console.error('Error in loadUserRoles middleware:', error);
    req.user.roles = [];
    req.user.permissions = [];
  }

  next();
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Load user permissions if not already loaded
    if (!user.roles || !user.permissions) {
      const userPermissions = await loadUserPermissions(user.userId);
      if (userPermissions) {
        user.roles = userPermissions.roles;
        user.permissions = userPermissions.permissions;
      } else {
        return res.status(403).json({
          success: false,
          message: 'User roles not found',
        });
      }
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasRequiredRole = hasAnyRole(user.roles, roles);

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
        required: roles,
        current: user.roles,
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermissions: string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Load user permissions if not already loaded
    if (!user.roles || !user.permissions) {
      const userPermissions = await loadUserPermissions(user.userId);
      if (userPermissions) {
        user.roles = userPermissions.roles;
        user.permissions = userPermissions.permissions;
      } else {
        return res.status(403).json({
          success: false,
          message: 'User permissions not found',
        });
      }
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasRequiredPermissions = hasAllPermissions(user.permissions, permissions);

    if (!hasRequiredPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permissions,
        current: user.permissions,
      });
    }

    next();
  };
};

// Combined role and permission authorization
export const requireRoleAndPermission = (allowedRoles: string | string[], requiredPermissions: string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Load user permissions if not already loaded
    if (!user.roles || !user.permissions) {
      const userPermissions = await loadUserPermissions(user.userId);
      if (userPermissions) {
        user.roles = userPermissions.roles;
        user.permissions = userPermissions.permissions;
      } else {
        return res.status(403).json({
          success: false,
          message: 'User authorization data not found',
        });
      }
    }

    // Check roles
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasRequiredRole = hasAnyRole(user.roles, roles);

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
        required: { roles, permissions: requiredPermissions },
        current: { roles: user.roles, permissions: user.permissions },
      });
    }

    // Check permissions
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasRequiredPermissions = hasAllPermissions(user.permissions, permissions);

    if (!hasRequiredPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: { roles, permissions },
        current: { roles: user.roles, permissions: user.permissions },
      });
    }

    next();
  };
};

// Resource owner authorization (user can only access their own resources)
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Load user permissions if not already loaded
    if (!user.roles || !user.permissions) {
      const userPermissions = await loadUserPermissions(user.userId);
      if (userPermissions) {
        user.roles = userPermissions.roles;
        user.permissions = userPermissions.permissions;
      }
    }

    // Check if user is admin (admins can access any resource)
    if (hasRole(user.roles || [], 'admin')) {
      return next();
    }

    // Get resource user ID from params, body, or query
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField] || req.query[resourceUserIdField];

    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: `Missing ${resourceUserIdField} in request`,
      });
    }

    if (user.userId !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own resources',
      });
    }

    next();
  };
};

// Flexible authorization that accepts multiple conditions
export const authorize = (options: {
  roles?: string | string[];
  permissions?: string | string[];
  allowOwnership?: boolean;
  ownershipField?: string;
}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { roles, permissions, allowOwnership = false, ownershipField = 'userId' } = options;

    // Load user permissions if not already loaded
    if (!user.roles || !user.permissions) {
      const userPermissions = await loadUserPermissions(user.userId);
      if (userPermissions) {
        user.roles = userPermissions.roles;
        user.permissions = userPermissions.permissions;
      } else {
        return res.status(403).json({
          success: false,
          message: 'User authorization data not found',
        });
      }
    }

    // Check if user is admin (admins bypass most checks)
    if (hasRole(user.roles, 'admin')) {
      return next();
    }

    // Check ownership if allowed
    if (allowOwnership) {
      const resourceUserId = req.params[ownershipField] || req.body[ownershipField] || req.query[ownershipField];

      if (resourceUserId && user.userId === resourceUserId) {
        return next();
      }
    }

    // Check roles
    if (roles) {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      const hasRequiredRole = hasAnyRole(user.roles, allowedRoles);

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges',
          required: allowedRoles,
          current: user.roles,
        });
      }
    }

    // Check permissions
    if (permissions) {
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      const hasRequiredPermissions = hasAllPermissions(user.permissions, requiredPermissions);

      if (!hasRequiredPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermissions,
          current: user.permissions,
        });
      }
    }

    next();
  };
};

export default {
  loadUserRoles,
  requireRole,
  requirePermission,
  requireRoleAndPermission,
  requireOwnership,
  authorize,
};
