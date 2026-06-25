import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DetectPhoneDto {
  @ApiProperty({ example: '+221771234567', description: 'Numéro au format international' })
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Numéro international invalide (ex: +221771234567)' })
  phone!: string;
}
