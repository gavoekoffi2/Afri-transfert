import { Module } from '@nestjs/common';
import { GeniusPayModule } from '../geniuspay/geniuspay.module';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { OperatorsService } from './operators.service';

@Module({
  imports: [GeniusPayModule],
  controllers: [CountriesController],
  providers: [CountriesService, OperatorsService],
  exports: [CountriesService, OperatorsService],
})
export class CountriesModule {}
