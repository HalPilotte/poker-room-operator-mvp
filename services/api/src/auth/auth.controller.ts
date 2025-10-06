import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequireRole } from './rbac.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  @RequireRole('ADMIN')
  async getProfile(@Query('userId') userId: string) {
    return this.authService.validateUser(userId);
  }
}