import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Mock PrismaClient interface for development when client can't be generated
interface MockPrismaClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $executeRaw(query: any): Promise<any>;
  $transaction<T>(operations: T[]): Promise<T>;
  user: any;
  player: any; 
  property: any;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy, MockPrismaClient {
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $executeRaw = jest.fn().mockResolvedValue([{ "1": 1 }]);
  $transaction = jest.fn();
  user = { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() };
  player = { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() };
  property = { findMany: jest.fn(), count: jest.fn() };

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
