import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateBeneficiaryDto {
  @ApiProperty({ example: 'Awa Traoré' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: '+22507481234', description: 'Numéro Mobile Money international' })
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Numéro Mobile Money international invalide' })
  phone!: string;

  @ApiProperty({ example: 'CI', description: 'Code pays ISO2 du bénéficiaire' })
  @IsString()
  @Length(2, 2)
  countryIso2!: string;

  @ApiPropertyOptional({ description: 'Identifiant de l\'opérateur (sinon détecté)' })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {}
