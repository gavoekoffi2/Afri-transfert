import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Amadou' })
  @IsString()
  @Length(1, 80)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsString()
  @Length(1, 80)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+221771234567' })
  @Matches(/^\+?[0-9\s().-]{6,20}$/, { message: 'Numéro de téléphone invalide' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'SN', description: 'Code pays ISO2' })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  countryIso2?: string;
}
