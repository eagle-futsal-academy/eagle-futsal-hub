import type { UserRole } from '../types';

export type Permission = 
  | 'manage_students' | 'view_students'
  | 'manage_attendance' | 'view_attendance' 
  | 'manage_billing' | 'view_billing'
  | 'manage_schedule' | 'view_schedule'
  | 'manage_performance' | 'view_performance'
  | 'manage_matches' | 'view_matches'
  | 'manage_standings' | 'view_standings'
  | 'manage_players' | 'view_players'
  | 'manage_competitions' | 'view_competitions'
  | 'manage_finances' | 'view_finances'
  | 'manage_events' | 'view_events'
  | 'manage_marketing' | 'view_marketing'
  | 'manage_sponsors' | 'view_sponsors'
  | 'view_advisory'
  | 'manage_system';

const VIEW_ALL: Permission[] = [
  'view_students', 'view_attendance', 'view_billing', 'view_schedule',
  'view_performance', 'view_matches', 'view_standings', 'view_players',
  'view_competitions', 'view_finances', 'view_events', 'view_marketing',
  'view_sponsors'
];

const MANAGE_ALL: Permission[] = [
  'manage_students', 'manage_attendance', 'manage_billing', 'manage_schedule',
  'manage_performance', 'manage_matches', 'manage_standings', 'manage_players',
  'manage_competitions', 'manage_finances', 'manage_events', 'manage_marketing',
  'manage_sponsors', 'view_advisory', 'manage_system'
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'admin': [...VIEW_ALL, ...MANAGE_ALL],
  'coach': [...VIEW_ALL, 'manage_performance', 'manage_matches', 'manage_players'],
  'staff': [...VIEW_ALL, 'manage_students', 'manage_attendance', 'manage_billing'],
  'parent': ['view_students', 'view_attendance', 'view_billing', 'view_performance'],
  'public': ['view_matches', 'view_standings', 'view_competitions'],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const canEdit = (role: UserRole): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(p => p.startsWith('manage_'));
};
