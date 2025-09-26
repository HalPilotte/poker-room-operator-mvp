import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RbacGuard } from '../rbac.guard';
import { AuthService } from '../auth.service';
import { ROLES_KEY, PROPERTY_KEY } from '../rbac.decorator';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;
  let authService: AuthService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockAuthService = {
    hasRole: jest.fn(),
    hasPropertyAccess: jest.fn(),
  };

  const createMockContext = (query: any = {}, headers: any = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ query, headers }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get<Reflector>(Reflector);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no restrictions are set', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      
      const context = createMockContext();
      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
    });

    it('should deny access when no user ID is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce('ADMIN').mockReturnValueOnce(undefined);
      
      const context = createMockContext();
      const result = await guard.canActivate(context);
      
      expect(result).toBe(false);
    });

    it('should allow access when user has required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce('ADMIN').mockReturnValueOnce(undefined);
      mockAuthService.hasRole.mockResolvedValue(true);
      
      const context = createMockContext({ userId: 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
      expect(authService.hasRole).toHaveBeenCalledWith('user-1', 'ADMIN');
    });

    it('should deny access when user does not have required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce('ADMIN').mockReturnValueOnce(undefined);
      mockAuthService.hasRole.mockResolvedValue(false);
      
      const context = createMockContext({ userId: 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(false);
    });

    it('should allow access when user has property access', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce(undefined).mockReturnValueOnce('prop-1');
      mockAuthService.hasPropertyAccess.mockResolvedValue(true);
      
      const context = createMockContext({ userId: 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
      expect(authService.hasPropertyAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    });

    it('should deny access when user does not have property access', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce(undefined).mockReturnValueOnce('prop-1');
      mockAuthService.hasPropertyAccess.mockResolvedValue(false);
      
      const context = createMockContext({ userId: 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(false);
    });

    it('should check both role and property when both are required', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce('ADMIN').mockReturnValueOnce('prop-1');
      mockAuthService.hasRole.mockResolvedValue(true);
      mockAuthService.hasPropertyAccess.mockResolvedValue(true);
      
      const context = createMockContext({ userId: 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
      expect(authService.hasRole).toHaveBeenCalledWith('user-1', 'ADMIN');
      expect(authService.hasPropertyAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    });

    it('should get user ID from header when not in query', async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce('ADMIN').mockReturnValueOnce(undefined);
      mockAuthService.hasRole.mockResolvedValue(true);
      
      const context = createMockContext({}, { 'x-user-id': 'user-1' });
      const result = await guard.canActivate(context);
      
      expect(result).toBe(true);
      expect(authService.hasRole).toHaveBeenCalledWith('user-1', 'ADMIN');
    });
  });
});