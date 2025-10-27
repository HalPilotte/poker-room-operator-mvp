import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { RbacGuard } from '../../auth/rbac.guard';
import { AuthService } from '../../auth/auth.service';
import { Reflector } from '@nestjs/core';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getUsers: jest.fn(),
    getProperties: jest.fn(),
  };

  const mockAuthService = {
    hasRole: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: RbacGuard, useValue: {} },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard stats', async () => {
      const mockStats = { players: 100, users: 5, properties: 2 };
      mockAdminService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getDashboard();

      expect(result).toEqual(mockStats);
      expect(adminService.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('should return users list', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', role: 'ADMIN' },
        { id: '2', email: 'user2@test.com', role: 'MANAGER' },
      ];
      mockAdminService.getUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers();

      expect(result).toEqual(mockUsers);
      expect(adminService.getUsers).toHaveBeenCalled();
    });
  });

  describe('getProperties', () => {
    it('should return properties list', async () => {
      const mockProperties = [
        { id: '1', name: 'Vegas Main', location: 'Las Vegas' },
        { id: '2', name: 'Reno Branch', location: 'Reno' },
      ];
      mockAdminService.getProperties.mockResolvedValue(mockProperties);

      const result = await controller.getProperties();

      expect(result).toEqual(mockProperties);
      expect(adminService.getProperties).toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});