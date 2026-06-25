import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, UserStatus } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ToggleActiveDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@afritransfer.africa' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe!2026' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class UpdateSettingDto {
  @ApiProperty({ example: '2.5' })
  @IsString()
  value!: string;
}

export class AdminUsersQuery extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche par email, nom' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class AdminTransactionsQuery extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Recherche par référence, nom ou téléphone bénéficiaire' })
  @IsString()
  @IsOptional()
  search?: string;
}
