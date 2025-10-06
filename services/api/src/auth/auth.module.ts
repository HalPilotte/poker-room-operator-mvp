import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RbacGuard } from './rbac.guard';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RbacGuard, PrismaService],
  exports: [AuthService, RbacGuard],
})
export class AuthModule {}