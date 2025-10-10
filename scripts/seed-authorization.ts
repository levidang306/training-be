import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { Permission } from '@/common/entities/permission.entity';
import { Role } from '@/common/entities/role.entity';
import { User } from '@/common/entities/user.entity';

export class AuthorizationSeeder {
  constructor(private dataSource: DataSource) {}

  async seedRolesAndPermissions(): Promise<void> {
    const roleRepository = this.dataSource.getRepository(Role);
    const permissionRepository = this.dataSource.getRepository(Permission);
    const userRepository = this.dataSource.getRepository(User);

    console.log('🌱 Starting RBAC seeding for Trello-like app...');

    // Define permissions for Trello-like app
    const permissionsData = [
      // Board permissions
      { name: 'boards:create', description: 'Create new boards' },
      { name: 'boards:read', description: 'View boards and their content' },
      { name: 'boards:update', description: 'Edit board details and settings' },
      { name: 'boards:delete', description: 'Delete boards' },
      { name: 'boards:manage', description: 'Full board management including member management' },

      // List permissions
      { name: 'lists:create', description: 'Create new lists in boards' },
      { name: 'lists:read', description: 'View lists' },
      { name: 'lists:update', description: 'Edit list details and reorder lists' },
      { name: 'lists:delete', description: 'Delete lists' },
      { name: 'lists:archive', description: 'Archive/unarchive lists' },

      // Card permissions
      { name: 'cards:create', description: 'Create new cards' },
      { name: 'cards:read', description: 'View cards and their details' },
      { name: 'cards:update', description: 'Edit card content, due dates, labels' },
      { name: 'cards:delete', description: 'Delete cards' },
      { name: 'cards:assign', description: 'Assign/unassign members to cards' },
      { name: 'cards:move', description: 'Move cards between lists and boards' },
      { name: 'cards:archive', description: 'Archive/unarchive cards' },

      // Comment permissions
      { name: 'comments:create', description: 'Add comments to cards' },
      { name: 'comments:read', description: 'View comments' },
      { name: 'comments:update', description: 'Edit own comments' },
      { name: 'comments:delete', description: 'Delete own comments' },
      { name: 'comments:moderate', description: 'Delete any comments' },

      // Member permissions
      { name: 'members:invite', description: 'Invite new members to boards' },
      { name: 'members:remove', description: 'Remove members from boards' },
      { name: 'members:read', description: 'View board members' },
      { name: 'members:manage', description: 'Manage member roles and permissions' },

      // Label permissions
      { name: 'labels:create', description: 'Create new labels' },
      { name: 'labels:read', description: 'View labels' },
      { name: 'labels:update', description: 'Edit label names and colors' },
      { name: 'labels:delete', description: 'Delete labels' },

      // Checklist permissions
      { name: 'checklists:create', description: 'Create checklists in cards' },
      { name: 'checklists:read', description: 'View checklists' },
      { name: 'checklists:update', description: 'Edit checklist items and mark as complete' },
      { name: 'checklists:delete', description: 'Delete checklists' },

      // Attachment permissions
      { name: 'attachments:create', description: 'Upload attachments to cards' },
      { name: 'attachments:read', description: 'View and download attachments' },
      { name: 'attachments:delete', description: 'Delete attachments' },

      // Notification permissions
      { name: 'notifications:read', description: 'View notifications' },
      { name: 'notifications:manage', description: 'Manage notification settings' },

      // Workspace/Organization permissions
      { name: 'workspaces:create', description: 'Create new workspaces' },
      { name: 'workspaces:read', description: 'View workspace details' },
      { name: 'workspaces:update', description: 'Edit workspace settings' },
      { name: 'workspaces:delete', description: 'Delete workspaces' },
      { name: 'workspaces:manage', description: 'Full workspace administration' },

      // User management permissions
      { name: 'users:read', description: 'View user profiles' },
      { name: 'users:update', description: 'Edit own profile' },
      { name: 'users:manage', description: 'Manage all users (admin only)' },
      { name: 'users:delete', description: 'Delete user accounts (admin only)' },

      // Report and analytics permissions
      { name: 'reports:read', description: 'View reports and analytics' },
      { name: 'reports:export', description: 'Export reports and data' },

      // System administration
      { name: 'system:admin', description: 'Full system administration access' },
      { name: 'system:backup', description: 'Perform system backups' },
      { name: 'system:maintenance', description: 'Perform system maintenance' },
    ];

    // Create permissions
    const createdPermissions: Permission[] = [];
    for (const permData of permissionsData) {
      let permission = await permissionRepository.findOne({ where: { name: permData.name } });

      if (!permission) {
        permission = permissionRepository.create({
          name: permData.name,
          description: permData.description,
        });
        await permissionRepository.save(permission);
        console.log(`✅ Created permission: ${permData.name}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permData.name}`);
      }

      createdPermissions.push(permission);
    }

    // Define roles with their permissions
    const rolesData = [
      {
        name: 'admin',
        description: 'System Administrator - Full access to all features',
        permissions: createdPermissions.filter(
          (p) =>
            p.name.includes('system:') ||
            p.name.includes('users:manage') ||
            p.name.includes('users:delete') ||
            p.name.includes('workspaces:') ||
            p.name.includes('reports:') ||
            p.name.includes('boards:') ||
            p.name.includes('lists:') ||
            p.name.includes('cards:') ||
            p.name.includes('comments:') ||
            p.name.includes('members:') ||
            p.name.includes('labels:') ||
            p.name.includes('checklists:') ||
            p.name.includes('attachments:') ||
            p.name.includes('notifications:')
        ),
      },
      {
        name: 'workspace_admin',
        description: 'Workspace Administrator - Full access within workspace',
        permissions: createdPermissions.filter(
          (p) =>
            p.name.includes('workspaces:') ||
            p.name.includes('boards:') ||
            p.name.includes('lists:') ||
            p.name.includes('cards:') ||
            p.name.includes('comments:') ||
            p.name.includes('members:') ||
            p.name.includes('labels:') ||
            p.name.includes('checklists:') ||
            p.name.includes('attachments:') ||
            p.name.includes('notifications:') ||
            p.name.includes('reports:read') ||
            p.name.includes('users:read') ||
            p.name.includes('users:update')
        ),
      },
      {
        name: 'board_owner',
        description: 'Board Owner - Full access to owned boards',
        permissions: createdPermissions.filter(
          (p) =>
            p.name.includes('boards:') ||
            p.name.includes('lists:') ||
            p.name.includes('cards:') ||
            p.name.includes('comments:') ||
            p.name.includes('members:') ||
            p.name.includes('labels:') ||
            p.name.includes('checklists:') ||
            p.name.includes('attachments:') ||
            p.name.includes('notifications:') ||
            p.name.includes('users:read') ||
            p.name.includes('users:update')
        ),
      },
      {
        name: 'board_admin',
        description: 'Board Administrator - Manage board content and members',
        permissions: createdPermissions.filter(
          (p) =>
            p.name === 'boards:read' ||
            p.name === 'boards:update' ||
            p.name.includes('lists:') ||
            p.name.includes('cards:') ||
            p.name.includes('comments:') ||
            p.name === 'members:invite' ||
            p.name === 'members:remove' ||
            p.name === 'members:read' ||
            p.name.includes('labels:') ||
            p.name.includes('checklists:') ||
            p.name.includes('attachments:') ||
            p.name.includes('notifications:') ||
            p.name.includes('users:read') ||
            p.name.includes('users:update')
        ),
      },
      {
        name: 'board_member',
        description: 'Board Member - Create and edit content',
        permissions: createdPermissions.filter(
          (p) =>
            p.name === 'boards:read' ||
            p.name === 'lists:read' ||
            p.name === 'lists:create' ||
            p.name === 'lists:update' ||
            p.name.includes('cards:') ||
            p.name === 'comments:create' ||
            p.name === 'comments:read' ||
            p.name === 'comments:update' ||
            p.name === 'comments:delete' ||
            p.name === 'members:read' ||
            p.name === 'labels:read' ||
            p.name === 'labels:create' ||
            p.name.includes('checklists:') ||
            p.name.includes('attachments:') ||
            p.name.includes('notifications:') ||
            p.name.includes('users:read') ||
            p.name.includes('users:update')
        ),
      },
      {
        name: 'board_observer',
        description: 'Board Observer - View only access',
        permissions: createdPermissions.filter(
          (p) =>
            p.name === 'boards:read' ||
            p.name === 'lists:read' ||
            p.name === 'cards:read' ||
            p.name === 'comments:read' ||
            p.name === 'members:read' ||
            p.name === 'labels:read' ||
            p.name === 'checklists:read' ||
            p.name === 'attachments:read' ||
            p.name === 'notifications:read' ||
            p.name === 'users:read' ||
            p.name === 'users:update'
        ),
      },
      {
        name: 'user',
        description: 'Regular User - Basic user capabilities',
        permissions: createdPermissions.filter(
          (p) =>
            p.name === 'boards:create' ||
            p.name === 'boards:read' ||
            p.name === 'workspaces:create' ||
            p.name === 'workspaces:read' ||
            p.name === 'users:read' ||
            p.name === 'users:update' ||
            p.name === 'notifications:read' ||
            p.name === 'notifications:manage'
        ),
      },
      {
        name: 'guest',
        description: 'Guest User - Limited access to specific boards',
        permissions: createdPermissions.filter(
          (p) =>
            p.name === 'boards:read' ||
            p.name === 'lists:read' ||
            p.name === 'cards:read' ||
            p.name === 'comments:read' ||
            p.name === 'members:read' ||
            p.name === 'labels:read' ||
            p.name === 'checklists:read' ||
            p.name === 'attachments:read' ||
            p.name === 'users:read'
        ),
      },
    ];

    // Create roles
    const createdRoles: Role[] = [];
    for (const roleData of rolesData) {
      let role = await roleRepository.findOne({
        where: { name: roleData.name },
        relations: ['permissions'],
      });

      if (!role) {
        role = roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        });
        await roleRepository.save(role);
        console.log(`✅ Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      } else {
        // Update permissions if role exists
        role.permissions = roleData.permissions;
        await roleRepository.save(role);
        console.log(`🔄 Updated role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      }

      createdRoles.push(role);
    }

    // Create sample users with roles
    const usersData = [
      {
        email: 'admin@trello.com',
        name: 'System Administrator',
        password: 'admin123',
        bio: 'System administrator with full access',
        isActive: true,
        roleName: 'admin',
      },
      {
        email: 'workspace.admin@trello.com',
        name: 'Workspace Admin',
        password: 'workspace123',
        bio: 'Workspace administrator',
        isActive: true,
        roleName: 'workspace_admin',
      },
      {
        email: 'board.owner@trello.com',
        name: 'Board Owner',
        password: 'board123',
        bio: 'Board owner and manager',
        isActive: true,
        roleName: 'board_owner',
      },
      {
        email: 'member@trello.com',
        name: 'Team Member',
        password: 'member123',
        bio: 'Active team member',
        isActive: true,
        roleName: 'board_member',
      },
      {
        email: 'observer@trello.com',
        name: 'Observer',
        password: 'observer123',
        bio: 'Read-only observer',
        isActive: true,
        roleName: 'board_observer',
      },
      {
        email: 'user@trello.com',
        name: 'Regular User',
        password: 'user123',
        bio: 'Regular user account',
        isActive: true,
        roleName: 'user',
      },
      {
        email: 'guest@trello.com',
        name: 'Guest User',
        password: 'guest123',
        bio: 'Guest with limited access',
        isActive: true,
        roleName: 'guest',
      },
    ];

    // Create users
    for (const userData of usersData) {
      let user = await userRepository.findOne({
        where: { email: userData.email },
        relations: ['role'],
      });

      const role = createdRoles.find((r) => r.name === userData.roleName);

      if (!user && role) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        user = userRepository.create({
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          bio: userData.bio,
          isActive: userData.isActive,
          role: [role], // ManyToMany relationship
        });

        await userRepository.save(user);
        console.log(`✅ Created user: ${userData.email} with role: ${userData.roleName}`);
      } else if (user && role) {
        // Update user role if user exists
        user.role = [role];
        await userRepository.save(user);
        console.log(`🔄 Updated user: ${userData.email} with role: ${userData.roleName}`);
      } else {
        console.log(`⏭️  User already exists or role not found: ${userData.email}`);
      }
    }

    console.log('🎉 RBAC seeding completed successfully!');
    console.log(`📊 Created ${createdPermissions.length} permissions and ${createdRoles.length} roles`);
    console.log('👥 Created sample users for each role');

    // Print summary
    console.log('\n📋 RBAC Summary:');
    console.log('================');

    for (const role of createdRoles) {
      const roleWithPermissions = await roleRepository.findOne({
        where: { id: role.id },
        relations: ['permissions'],
      });
      console.log(`🔐 ${role.name}: ${roleWithPermissions?.permissions.length || 0} permissions`);
    }
  }

  async down(): Promise<void> {
    const roleRepository = this.dataSource.getRepository(Role);
    const permissionRepository = this.dataSource.getRepository(Permission);
    const userRepository = this.dataSource.getRepository(User);

    console.log('🧹 Cleaning up RBAC data...');

    // Remove users (optional)
    await userRepository.delete({});
    console.log('🗑️  Removed all users');

    // Remove roles
    await roleRepository.delete({});
    console.log('🗑️  Removed all roles');

    // Remove permissions
    await permissionRepository.delete({});
    console.log('🗑️  Removed all permissions');

    console.log('✅ RBAC cleanup completed');
  }
}

// Export for use in migration or standalone script
export default AuthorizationSeeder;
