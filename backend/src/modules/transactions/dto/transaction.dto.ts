import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

/**
 * Demande de devis (affichage temps réel des frais avant envoi).
 */
export class QuoteTransferDto {
  @ApiProperty({ example: 'CM', description: "Pays d'origine (ISO2)" })
  @IsString()
  @Length(2, 2)
  senderCountryIso2!: string;

  @ApiProperty({ example: 'TG', description: 'Pays du bénéficiaire (ISO2)' })
  @IsString()
  @Length(2, 2)
  recipientCountryIso2!: string;

  @ApiProperty({ example: 10000, description: 'Montant envoyé (devise du pays d\'origine)' })
  @IsNumber()
  @IsPositive()
  amount!: number;
}

/**
 * Création d'un transfert (envoi d'argent).
 */
export class CreateTransferDto {
  @ApiProperty({ example: 'CM' })
  @IsString()
  @Length(2, 2)
  senderCountryIso2!: string;

  @ApiProperty({ example: 'TG' })
  @IsString()
  @Length(2, 2)
  recipientCountryIso2!: string;

  @ApiProperty({ example: 'Awa Traoré', description: 'Nom du bénéficiaire' })
  @IsString()
  @Length(2, 120)
  recipientName!: string;

  @ApiProperty({ example: '+22890123456', description: 'Numéro Mobile Money du bénéficiaire' })
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Numéro Mobile Money international invalide' })
  recipientPhone!: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Opérateur ciblé. Si omis, GeniusPay détecte automatiquement (checkout).',
  })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiPropertyOptional({ description: 'Réutiliser un bénéficiaire enregistré' })
  @IsUUID()
  @IsOptional()
  beneficiaryId?: string;

  @ApiPropertyOptional({ description: 'Enregistrer le bénéficiaire pour les prochains envois' })
  @IsOptional()
  saveBeneficiary?: boolean;
}
