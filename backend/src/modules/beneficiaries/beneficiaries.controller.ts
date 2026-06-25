import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from './dto/beneficiary.dto';

@ApiTags('beneficiaries')
@ApiBearerAuth('access-token')
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiaries: BeneficiariesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister mes bénéficiaires' })
  list(@CurrentUser('sub') userId: string) {
    return this.beneficiaries.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un bénéficiaire' })
  get(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.beneficiaries.getOwned(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un bénéficiaire' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBeneficiaryDto) {
    return this.beneficiaries.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un bénéficiaire' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
  ) {
    return this.beneficiaries.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un bénéficiaire' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.beneficiaries.remove(userId, id);
  }
}
