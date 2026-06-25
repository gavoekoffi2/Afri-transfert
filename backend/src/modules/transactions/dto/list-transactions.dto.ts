import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}
