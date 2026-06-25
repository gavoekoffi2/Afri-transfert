import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminService } from './admin.service';
import {
  AdminLoginDto,
  AdminTransactionsQuery,
  AdminUsersQuery,
  ToggleActiveDto,
  UpdateSettingDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  // ------------------------------------------------------------------- AUTH
  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion administrateur' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuth.login(dto);
  }
}

/**
 * Routes protégées du dashboard administrateur.
 * Toutes exigent un jeton admin (JwtAuthGuard global + AdminGuard).
 */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du tableau de bord' })
  stats() {
    return this.admin.stats();
  }

  // --- Utilisateurs ---
  @Get('users')
  @ApiOperation({ summary: 'Lister les utilisateurs' })
  listUsers(@Query() query: AdminUsersQuery) {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Détails d\'un utilisateur' })
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Modifier le statut d\'un utilisateur' })
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.updateUserStatus(id, dto.status);
  }

  // --- Transactions ---
  @Get('transactions')
  @ApiOperation({ summary: 'Lister toutes les transactions' })
  listTransactions(@Query() query: AdminTransactionsQuery) {
    return this.admin.listTransactions(query);
  }

  @Get('transactions/export')
  @ApiOperation({ summary: 'Exporter les transactions en CSV' })
  async exportTransactions(@Res() res: Response) {
    const csv = await this.admin.exportTransactionsCsv();
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="transactions.csv"')
      .send(csv);
  }

  @Get('transactions/:reference')
  @ApiOperation({ summary: 'Détails d\'une transaction' })
  getTransaction(@Param('reference') reference: string) {
    return this.admin.getTransaction(reference);
  }

  // --- Pays & opérateurs ---
  @Get('countries')
  @ApiOperation({ summary: 'Lister les pays (admin)' })
  countries() {
    return this.admin.listCountries();
  }

  @Patch('countries/:iso2/active')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Activer/désactiver un pays' })
  toggleCountry(@Param('iso2') iso2: string, @Body() dto: ToggleActiveDto) {
    return this.admin.setCountryActive(iso2, dto.isActive);
  }

  @Post('operators/sync')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser les opérateurs depuis GeniusPay' })
  syncOperators() {
    return this.admin.syncOperators();
  }

  // --- Paramètres / commissions ---
  @Get('settings')
  @ApiOperation({ summary: 'Lister les paramètres système' })
  settings() {
    return this.admin.listSettings();
  }

  @Put('settings/:key')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Modifier un paramètre (commission, etc.)' })
  updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.admin.updateSetting(key, dto.value);
  }

  // --- GeniusPay ---
  @Get('geniuspay/balance')
  @ApiOperation({ summary: 'Solde du compte marchand GeniusPay' })
  balance() {
    return this.admin.getBalance();
  }

  @Get('geniuspay/account')
  @ApiOperation({ summary: 'Informations du compte marchand GeniusPay' })
  account() {
    return this.admin.getGeniusPayAccount();
  }

  // --- Webhooks ---
  @Get('webhooks')
  @ApiOperation({ summary: 'Historique des webhooks reçus' })
  webhooks(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.admin.listWebhooks(Number(page), Number(limit));
  }
}
