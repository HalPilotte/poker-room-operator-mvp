

import { IsBoolean, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, MaxLength } from 'class-validator';

export enum PlayerStatusDto {
  active = 'active',
  ban = 'ban',
  hold = 'hold',
}

export class CreatePlayerDto {
  @IsString()
  @Length(1, 80)
  name!: string;

  // Using E.164 to keep input sane; if local numbers are needed, swap to regex validation.
  @IsString()
  @Length(7, 20)
  phone!: string;

  @IsBoolean()
  consent!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsEnum(PlayerStatusDto)
  status?: PlayerStatusDto;
}