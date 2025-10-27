import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RbacGuard } from '../auth/rbac.guard';
import { RequireRole } from '../auth/rbac.decorator';

@Controller('admin')
@UseGuards(RbacGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @RequireRole('ADMIN')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @RequireRole('ADMIN')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('properties')
  @RequireRole('ADMIN')
  async getProperties() {
    return this.adminService.getProperties();
  }
}