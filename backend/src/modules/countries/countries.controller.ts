import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CountriesService } from './countries.service';
import { DetectPhoneDto } from './dto/detect-phone.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countries: CountriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les pays supportés' })
  list() {
    return this.countries.listActive();
  }

  @Public()
  @Get('currencies')
  @ApiOperation({ summary: 'Lister les devises supportées' })
  currencies() {
    return this.countries.listCurrencies();
  }

  @Public()
  @Get('detect')
  @ApiOperation({ summary: 'Détecter pays + opérateurs depuis un numéro Mobile Money' })
  detect(@Query() dto: DetectPhoneDto) {
    return this.countries.detectByPhone(dto.phone);
  }

  @Public()
  @Get(':iso2/operators')
  @ApiOperation({ summary: 'Lister les opérateurs Mobile Money d\'un pays' })
  operators(@Param('iso2') iso2: string) {
    return this.countries.getOperators(iso2);
  }
}
