import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class RegisterDto {
  @ApiProperty({ example: 'amadou@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Amadou' })
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @Length(1, 80)
  lastName!: string;

  @ApiPropertyOptional({ example: '+221771234567' })
  // Tolérant à l'inscription (contact optionnel) : local ou international.
  @Matches(/^\+?[0-9\s().-]{6,20}$/, { message: 'Numéro de téléphone invalide' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'SN' })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  countryIso2?: string;

  @ApiProperty({ example: 'Password123', description: 'Min 8 car., 1 maj, 1 min, 1 chiffre' })
  @Matches(PASSWORD_RULE, {
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
  })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'amadou@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: '123456', description: 'Code 2FA (si activé)' })
  @IsString()
  @IsOptional()
  twoFactorCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Jeton reçu par email' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class RequestPhoneVerificationDto {
  @ApiPropertyOptional({ description: 'Numéro à vérifier (sinon celui du profil)' })
  @Matches(/^\+[1-9]\d{6,14}$/)
  @IsOptional()
  phone?: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres' })
  @IsString()
  @Length(4, 8)
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'amadou@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Jeton reçu par email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewPassword123' })
  @Matches(PASSWORD_RULE, {
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
  })
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword123' })
  @Matches(PASSWORD_RULE, {
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
  })
  newPassword!: string;
}
