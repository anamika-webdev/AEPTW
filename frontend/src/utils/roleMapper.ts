// frontend/src/utils/roleMapper.ts
// Multi-role support for users with comma-separated roles
// Maps database roles to frontend roles AND determines dashboard priority

export type DatabaseRole =
  | 'Admin'
  | 'Administrator'
  | 'Approver_Safety'
  | 'Approver_AreaOwner'
  | 'Approver_AreaManager'
  | 'Approver_SiteLeader'
  | 'Requester'
  | 'Supervisor'
  | 'Worker';

export type FrontendRole = 'Admin' | 'Supervisor' | 'Worker' | 'Approver';

/**
 * Determines the highest priority frontend role from user's roles
 * Priority: Admin > Approver > Supervisor > Worker
 * 
 * @param dbRoles - Comma-separated string of database roles (e.g., "Safety Officer, Administrator, Supervisor")
 * @returns The highest priority frontend role
 */
export function getHighestPriorityRole(dbRoles: string): FrontendRole {
  if (!dbRoles) return 'Worker';

  // Split and clean roles
  const roles = dbRoles.split(',').map(r => r.trim().toLowerCase());

  console.log('🔍 Processing roles:', roles);

  // Priority order (highest first)

  // 1. Check for Admin
  if (roles.some(r =>
    r === 'admin' ||
    r === 'administrator'
  )) {
    console.log('✅ Highest role: Admin');
    return 'Admin';
  }

  // 2. Check for Approver roles
  if (roles.some(r =>
    r === 'approver_safety' ||
    r === 'approver_areaowner' ||
    r === 'approver_areamanager' ||
    r === 'approver_siteleader' ||
    r.includes('approver')
  )) {
    console.log('✅ Highest role: Approver');
    return 'Approver';
  }

  // 3. Check for Supervisor/Requester
  if (roles.some(r =>
    r === 'supervisor' ||
    r === 'requester'
  )) {
    console.log('✅ Highest role: Supervisor');
    return 'Supervisor';
  }

  // 4. Default to Worker
  console.log('✅ Highest role: Worker');
  return 'Worker';
}

/**
 * Maps a single database role to frontend role
 * Used for displaying individual role badges
 */
export function mapDatabaseRoleToFrontend(dbRole: string): FrontendRole {
  const role = dbRole.toLowerCase();

  if (role === 'admin' || role === 'administrator') return 'Admin';

  if (role.startsWith('approver_') || role.includes('approver')) return 'Approver';

  if (role === 'requester' || role === 'supervisor') return 'Supervisor';

  return 'Worker';
}

/**
 * Gets display name for database role
 */
export function getRoleDisplayName(role: string): string {
  const r = role.toLowerCase();

  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'administrator': 'Administrator',
    'approver_safety': 'Safety Officer',
    'approver_areaowner': 'Area Owner',
    'approver_areamanager': 'Area Manager',
    'approver_siteleader': 'Site Leader',
    'requester': 'Requester',
    'supervisor': 'Supervisor',
    'worker': 'Worker'
  };

  return roleMap[r] || role;
}

/**
 * Formats multiple roles for display
 * Example: "Approver_Safety,Admin,Supervisor" => "Safety Officer, Administrator, Supervisor"
 */
export function formatRolesForDisplay(roles: string): string {
  if (!roles) return 'No Role';

  return roles
    .split(',')
    .map(r => getRoleDisplayName(r.trim()))
    .join(', ');
}

/**
 * Checks if user has specific permission based on their roles
 */
export function hasPermission(roles: string, permission: string): boolean {
  const highestRole = getHighestPriorityRole(roles);

  const permissions: Record<FrontendRole, string[]> = {
    'Admin': [
      'view_all_permits',
      'create_permit',
      'edit_permit',
      'delete_permit',
      'manage_users',
      'manage_sites',
      'view_analytics',
      'approve_permits',
      'extend_permits'
    ],
    'Approver': [
      'view_permits',
      'approve_permits',
      'reject_permits',
      'view_pending_approvals',
      'extend_permits'
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

  return permissions[highestRole]?.includes(permission) || false;
}

/**
 * Checks if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string, rolesToCheck: string[]): boolean {
  const roles = userRoles.split(',').map(r => r.trim().toLowerCase());
  const checks = rolesToCheck.map(r => r.toLowerCase());
  return roles.some(role => checks.includes(role));
}

/**
 * Checks if user has a specific role
 */
export function hasRole(userRoles: string, roleToCheck: string): boolean {
  const roles = userRoles.split(',').map(r => r.trim().toLowerCase());
  return roles.includes(roleToCheck.toLowerCase());
}