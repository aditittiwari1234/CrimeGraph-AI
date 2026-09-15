export type UserRole = 'administrator' | 'senior_investigator' | 'investigator' | 'analyst';

export const INSPECTOR_ROLES: UserRole[] = ['investigator', 'senior_investigator'];

export function isInspectorRole(role?: string): boolean {
  return INSPECTOR_ROLES.includes(role as UserRole);
}

export function canManageDatabases(role?: string): boolean {
  return role === 'administrator';
}

export function canViewAuditLogs(role?: string): boolean {
  return role === 'administrator' || role === 'senior_investigator';
}