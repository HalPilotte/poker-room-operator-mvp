import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [PlayersModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}