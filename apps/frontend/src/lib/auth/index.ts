export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PLAYER';
  properties: { id: string; name: string; location: string }[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Mock auth context for now - in real app would come from authentication provider
export const mockAuthContext: AuthState = {
  user: {
    id: 'admin-user-1',
    email: 'admin@pokerroom.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    properties: [
      { id: 'prop-1', name: 'Vegas Main', location: 'Las Vegas, NV' },
      { id: 'prop-2', name: 'Reno Branch', location: 'Reno, NV' },
    ],
  },
  isAuthenticated: true,
  isLoading: false,
};

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role;
}

export function hasPropertyAccess(user: User | null, propertyId: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.properties.some(p => p.id === propertyId);
}

export function requireAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN');
}