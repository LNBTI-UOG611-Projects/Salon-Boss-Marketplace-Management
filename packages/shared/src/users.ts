import type { Permission } from './permissions';
import type { Role } from './roles';

export const APP_LANGUAGES = ['en', 'si'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export type UserType = 'CUSTOMER' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'DEACTIVATED' | 'DELETED';

export interface MeDto {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  userType: UserType;
  status: UserStatus;
  roles: Role[];
  permissions: Permission[];
  preferredLanguage: AppLanguage | null;
}

export type RegistrationStep =
  | 'details'
  | 'contact'
  | 'identity'
  | 'preferences'
  | 'done';

export interface RegistrationStatusDto {
  nextStep: RegistrationStep;
}
