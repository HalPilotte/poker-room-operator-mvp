import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ROLES_KEY, PROPERTY_KEY } from './rbac.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<string>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredProperty = this.reflector.getAllAndOverride<string>(PROPERTY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole && !requiredProperty) {
      return true; // No restrictions
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.query.userId || request.headers['x-user-id'];

    if (!userId) {
      return false; // No user ID provided
    }

    // Check role-based access control (RBAC)
    if (requiredRole) {
      const hasRole = await this.authService.hasRole(userId, requiredRole);
      if (!hasRole) {
        return false;
      }
    }

    // Check attribute-based access control (ABAC) for properties
    if (requiredProperty) {
      const hasPropertyAccess = await this.authService.hasPropertyAccess(userId, requiredProperty);
      if (!hasPropertyAccess) {
        return false;
      }
    }

    return true;
  }
}