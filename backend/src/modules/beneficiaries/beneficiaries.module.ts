import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';

@Module({
  imports: [CountriesModule],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
