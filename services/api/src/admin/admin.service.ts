import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const playerCount = await this.prisma.player.count();
    const userCount = await this.prisma.user.count();
    const propertyCount = await this.prisma.property.count();
    
    return {
      players: playerCount,
      users: userCount,
      properties: propertyCount,
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      include: { properties: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProperties() {
    return this.prisma.property.findMany({
      include: { users: true },
      orderBy: { name: 'asc' },
    });
  }
}