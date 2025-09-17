

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

export type PlayerStatus = 'active' | 'ban' | 'hold';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; phone: string; consent: boolean; notes?: string; status?: PlayerStatus }) {
    try {
      return await this.prisma.player.create({ data: { ...data, status: data.status ?? 'active' } });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('phone')) {
        throw new ConflictException('phone already exists');
      }
      throw e;
    }
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException('player not found');
    return player;
  }

  async findAll(params: { query?: string; page?: number; size?: number; includeBanned?: boolean }) {
    const page = Math.max(1, Number(params.page) || 1);
    const size = Math.min(100, Math.max(1, Number(params.size) || 20));
    const q = params.query?.trim();
    const where: Prisma.PlayerWhereInput = {
      ...(params.includeBanned ? {} : { status: { not: 'ban' } }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.player.count({ where }),
      this.prisma.player.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total, page, size } };
  }

  async update(id: string, data: Partial<{ name: string; phone: string; consent: boolean; notes?: string; status: PlayerStatus }>) {
    try {
      return await this.prisma.player.update({ where: { id }, data });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('phone')) {
        throw new ConflictException('phone already exists');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('player not found');
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      return await this.prisma.player.update({ where: { id }, data: { status: 'ban' } });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('player not found');
      throw e;
    }
  }
}