

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/creat-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('players')
export class PlayerController {
  constructor(private readonly players: PlayerService) {}

  @Post()
  create(@Body() dto: CreatePlayerDto) {
    return this.players.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.players.findOne(id);
  }

  @Get()
  findAll(
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('includeBanned') includeBanned?: string,
  ) {
    return this.players.findAll({ query, page: Number(page), size: Number(size), includeBanned: includeBanned === 'true' });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.players.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.players.softDelete(id);
  }
}