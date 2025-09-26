import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { PlayersModule } from './players/players.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PlayersModule, AuthModule, AdminModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}