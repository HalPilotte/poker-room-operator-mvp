import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PLAYER';
  properties: { id: string; name: string; location: string }[];
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { properties: true },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as any,
        properties: user.properties,
      };
    } catch (error) {
      return null;
    }
  }

  async hasRole(userId: string, requiredRole: string): Promise<boolean> {
    const user = await this.validateUser(userId);
    if (!user) return false;
    return user.role === requiredRole;
  }

  async hasPropertyAccess(userId: string, propertyId: string): Promise<boolean> {
    const user = await this.validateUser(userId);
    if (!user) return false;
    
    // Admins have access to all properties
    if (user.role === 'ADMIN') return true;
    
    // Check if user has access to specific property
    return user.properties.some(p => p.id === propertyId);
  }
}