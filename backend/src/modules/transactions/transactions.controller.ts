import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransferDto, QuoteTransferDto } from './dto/transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculer les frais d\'un transfert (temps réel)' })
  quote(@Body() dto: QuoteTransferDto) {
    return this.transactions.quote(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Envoyer de l\'argent' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTransferDto, @Req() req: Request, @Ip() ip: string) {
    return this.transactions.create(userId, dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: ip,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Historique de mes transferts' })
  list(@CurrentUser('sub') userId: string, @Query() query: ListTransactionsDto) {
    return this.transactions.list(userId, query, query.status);
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Détails d\'un transfert' })
  get(@CurrentUser('sub') userId: string, @Param('reference') reference: string) {
    return this.transactions.getOwnedByReference(userId, reference);
  }

  @Get(':reference/receipt')
  @ApiOperation({ summary: 'Reçu d\'un transfert' })
  receipt(@CurrentUser('sub') userId: string, @Param('reference') reference: string) {
    return this.transactions.getReceipt(userId, reference);
  }

  @Post(':reference/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un transfert en attente' })
  cancel(@CurrentUser('sub') userId: string, @Param('reference') reference: string) {
    return this.transactions.cancel(userId, reference);
  }

  @Post(':reference/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forcer la synchronisation du statut avec GeniusPay' })
  sync(@CurrentUser('sub') userId: string, @Param('reference') reference: string) {
    return this.transactions.syncStatus(userId, reference);
  }
}
