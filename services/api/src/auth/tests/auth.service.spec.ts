import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    properties: [
      { id: 'prop-1', name: 'Property 1', location: 'Location 1' }
    ]
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        properties: [
          { id: 'prop-1', name: 'Property 1', location: 'Location 1' }
        ]
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { properties: true },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('invalid-user');

      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has required role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.hasRole('user-1', 'ADMIN');

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: 'PLAYER'
      });

      const result = await service.hasRole('user-1', 'ADMIN');

      expect(result).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.hasRole('invalid-user', 'ADMIN');

      expect(result).toBe(false);
    });
  });

  describe('hasPropertyAccess', () => {
    it('should return true for admin users regardless of property', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.hasPropertyAccess('user-1', 'any-property-id');

      expect(result).toBe(true);
    });

    it('should return true when user has access to specific property', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: 'MANAGER'
      });

      const result = await service.hasPropertyAccess('user-1', 'prop-1');

      expect(result).toBe(true);
    });

    it('should return false when user does not have access to property', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: 'MANAGER',
        properties: []
      });

      const result = await service.hasPropertyAccess('user-1', 'prop-1');

      expect(result).toBe(false);
    });
  });
});