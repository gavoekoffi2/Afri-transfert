import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/configuration';
import { CountriesModule } from '../countries/countries.module';
import { GeniusPayModule } from '../geniuspay/geniuspay.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminController, AdminDashboardController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    GeniusPayModule,
    CountriesModule,
    JwtModule.register({}),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminService, AdminAuthService],
})
export class AdminModule {}
