import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRole = (role: string) => SetMetadata(ROLES_KEY, role);

export const PROPERTY_KEY = 'property';
export const RequireProperty = (propertyId: string) => SetMetadata(PROPERTY_KEY, propertyId);