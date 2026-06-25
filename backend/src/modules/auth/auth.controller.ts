import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RequestPhoneVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private ctx(req: Request, ip: string) {
    return { userAgent: req.headers['user-agent'], ipAddress: ip };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Créer un compte' })
  register(@Body() dto: RegisterDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.register(dto, this.ctx(req, ip));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.login(dto, this.ctx(req, ip));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les jetons (rotation)' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.refresh(dto.refreshToken, this.ctx(req, ip));
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter (révoque les sessions)' })
  async logout(@CurrentUser('sub') userId: string) {
    await this.auth.logout(userId);
    return { message: 'Déconnexion réussie' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier l\'adresse email' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @ApiBearerAuth('access-token')
  @Post('phone/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un code de vérification par SMS' })
  async requestPhone(@CurrentUser('sub') userId: string, @Body() dto: RequestPhoneVerificationDto) {
    await this.auth.requestPhoneVerification(userId, dto.phone);
    return { message: 'Code envoyé par SMS' };
  }

  @ApiBearerAuth('access-token')
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le numéro de téléphone' })
  verifyPhone(@CurrentUser('sub') userId: string, @Body() dto: VerifyPhoneDto) {
    return this.auth.verifyPhone(userId, dto.code);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander la réinitialisation du mot de passe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto);
    return { message: 'Si un compte existe, un email de réinitialisation a été envoyé' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  @ApiBearerAuth('access-token')
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer son mot de passe' })
  async changePassword(@CurrentUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(userId, dto);
    return { message: 'Mot de passe modifié avec succès' };
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Informations du compte connecté (depuis le jeton)' })
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
