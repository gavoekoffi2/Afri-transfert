import { Injectable, NotFoundException } from '@nestjs/common';
import { Country, Operator } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DetectionResult {
  country: Country | null;
  operators: Operator[];
}

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<Country[]> {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  listCurrencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getByIso2(iso2: string): Promise<Country> {
    const country = await this.prisma.country.findUnique({ where: { iso2: iso2.toUpperCase() } });
    if (!country) {
      throw new NotFoundException(`Pays non supporté : ${iso2}`);
    }
    return country;
  }

  async getOperators(iso2: string): Promise<Operator[]> {
    const country = await this.getByIso2(iso2);
    return this.prisma.operator.findMany({
      where: { countryId: country.id, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Détecte le pays à partir d'un numéro international (+indicatif…) par
   * correspondance du plus long indicatif, puis renvoie ses opérateurs.
   * Reproduit, côté plateforme, l'auto-détection PawaPay de GeniusPay.
   */
  async detectByPhone(phone: string): Promise<DetectionResult> {
    const normalized = phone.replace(/[\s-]/g, '');
    const countries = await this.prisma.country.findMany({ where: { isActive: true } });

    const match = countries
      .filter((c) => c.callingCode && normalized.startsWith(c.callingCode))
      .sort((a, b) => (b.callingCode?.length ?? 0) - (a.callingCode?.length ?? 0))[0];

    if (!match) {
      return { country: null, operators: [] };
    }
    const operators = await this.prisma.operator.findMany({
      where: { countryId: match.id, isActive: true },
      orderBy: { name: 'asc' },
    });
    return { country: match, operators };
  }
}
