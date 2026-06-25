import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Beneficiary } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CountriesService } from '../countries/countries.service';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from './dto/beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly countries: CountriesService,
  ) {}

  list(userId: string): Promise<Beneficiary[]> {
    return this.prisma.beneficiary.findMany({
      where: { userId },
      include: { country: true, operator: true },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });
  }

  async getOwned(userId: string, id: string): Promise<Beneficiary> {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id },
      include: { country: true, operator: true },
    });
    if (!beneficiary) {
      throw new NotFoundException('Bénéficiaire introuvable');
    }
    if (beneficiary.userId !== userId) {
      throw new ForbiddenException('Accès refusé à ce bénéficiaire');
    }
    return beneficiary;
  }

  async create(userId: string, dto: CreateBeneficiaryDto): Promise<Beneficiary> {
    const country = await this.countries.getByIso2(dto.countryIso2);
    return this.prisma.beneficiary.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        countryId: country.id,
        operatorId: dto.operatorId,
        isFavorite: dto.isFavorite ?? false,
      },
      include: { country: true, operator: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    await this.getOwned(userId, id);
    const data: Record<string, unknown> = {
      name: dto.name,
      phone: dto.phone,
      operatorId: dto.operatorId,
      isFavorite: dto.isFavorite,
    };
    if (dto.countryIso2) {
      const country = await this.countries.getByIso2(dto.countryIso2);
      data.countryId = country.id;
    }
    return this.prisma.beneficiary.update({
      where: { id },
      data,
      include: { country: true, operator: true },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.beneficiary.delete({ where: { id } });
  }
}
