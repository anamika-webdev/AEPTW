// src/utils/roleMapper.ts
// Maps database roles to frontend roles WITHOUT changing the database

export type DatabaseRole = 
  | 'Admin' 
  | 'Approver_Safety' 
  | 'Approver_AreaManager' 
  | 'Requester'
  | 'Supervisor'  // In case database already has this
  | 'Worker';     // In case database already has this

export type FrontendRole = 'Admin' | 'Supervisor' | 'Worker';

/**
 * Maps database role to frontend role
 * 
 * Mapping:
 * - Admin → Admin
 * - Approver_Safety → Supervisor
 * - Approver_AreaManager → Supervisor
 * - Requester → Supervisor
 */
export function mapDatabaseRoleToFrontend(dbRole: string): FrontendRole {
  switch (dbRole) {
    case 'Admin':
      return 'Admin';
    
    case 'Approver_Safety':
    case 'Approver_AreaManager':
    case 'Requester':
    case 'Supervisor':  // Already correct
      return 'Supervisor';
    
    case 'Worker':
    default:
      return 'Worker';
  }
}

/**
 * Gets display name for database role
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'Admin':
      return 'Administrator';
    case 'Approver_Safety':
      return 'Safety Officer';
    case 'Approver_AreaManager':
      return 'Area Manager';
    case 'Requester':
      return 'Requester';
    case 'Supervisor':
      return 'Supervisor';
    case 'Worker':
      return 'Worker';
    default:
      return role;
  }
}

/**
 * Checks if user has specific permission based on their role
 */
export function hasPermission(role: string, permission: string): boolean {
  const frontendRole = mapDatabaseRoleToFrontend(role);
  
  const permissions: Record<FrontendRole, string[]> = {
    'Admin': [
      'view_all_permits',
      'create_permit',
      'edit_permit',
      'delete_permit',
      'manage_users',
      'manage_sites',
      'view_analytics'
    ],
    'Supervisor': [
      'view_permits',
      'create_permit',
      'edit_permit',
      'extend_permit',
      'close_permit',
      'manage_workers'
    ],
    'Worker': [
      'view_own_permits'
    ]
  };
  
  return permissions[frontendRole]?.includes(permission) || false;
}