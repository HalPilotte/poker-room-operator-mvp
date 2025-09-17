import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  async health() {
    // use $executeRaw or $queryRawUnsafe
    await this.prisma.$executeRaw`SELECT 1`;
    return { ok: true, db: 'up' };
  }
}