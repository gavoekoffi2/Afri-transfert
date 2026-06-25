/**
 * Amorçage de la base AfriTransfer :
 *  - devises, pays et opérateurs (catalogue GeniusPay) ;
 *  - paramètres système (commission, environnement GeniusPay) ;
 *  - administrateur par défaut.
 *
 * Idempotent : peut être ré-exécuté sans dupliquer les données (upsert).
 */
import 'dotenv/config';
import { PrismaClient, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { COUNTRIES, CURRENCIES } from './seed-data';

const prisma = new PrismaClient();

async function seedCurrencies() {
  for (const c of CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: { name: c.name, symbol: c.symbol, decimals: c.decimals },
      create: c,
    });
  }
  console.log(`✓ ${CURRENCIES.length} devises`);
}

async function seedCountriesAndOperators() {
  let operatorCount = 0;
  for (const country of COUNTRIES) {
    const record = await prisma.country.upsert({
      where: { iso2: country.iso2 },
      update: {
        iso3: country.iso3,
        name: country.name,
        callingCode: country.callingCode,
        currencyCode: country.currencyCode,
        region: country.region,
        flagEmoji: country.flagEmoji,
        supportsPawapay: country.supportsPawapay,
      },
      create: {
        iso2: country.iso2,
        iso3: country.iso3,
        name: country.name,
        callingCode: country.callingCode,
        currencyCode: country.currencyCode,
        region: country.region,
        flagEmoji: country.flagEmoji,
        supportsPawapay: country.supportsPawapay,
      },
    });

    for (const op of country.operators) {
      await prisma.operator.upsert({
        where: { code: op.code },
        update: {
          name: op.name,
          paymentMethod: op.paymentMethod as PaymentMethod,
          gateway: op.gateway,
          countryId: record.id,
        },
        create: {
          code: op.code,
          name: op.name,
          type: 'MMO',
          paymentMethod: op.paymentMethod as PaymentMethod,
          gateway: op.gateway,
          countryId: record.id,
        },
      });
      operatorCount++;
    }
  }
  console.log(`✓ ${COUNTRIES.length} pays, ${operatorCount} opérateurs`);
}

async function seedSettings() {
  const settings = [
    { key: 'commission.percent', value: '2', type: 'number', group: 'commission', description: 'Pourcentage de commission AfriTransfer' },
    { key: 'commission.fixed', value: '100', type: 'number', group: 'commission', description: 'Frais fixes AfriTransfer (FCFA)' },
    { key: 'commission.currency', value: 'XOF', type: 'string', group: 'commission', description: 'Devise de la commission' },
    { key: 'geniuspay.environment', value: 'sandbox', type: 'string', group: 'geniuspay', description: 'Environnement GeniusPay actif' },
    { key: 'geniuspay.fee_percent_estimate', value: '2.5', type: 'number', group: 'geniuspay', description: 'Estimation des frais GeniusPay (affichage)' },
    { key: 'transfer.min_amount', value: '200', type: 'number', group: 'general', description: 'Montant minimum d\'un transfert (XOF)' },
    { key: 'transfer.max_amount', value: '2000000', type: 'number', group: 'general', description: 'Montant maximum d\'un transfert (XOF)' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type, group: s.group, description: s.description },
      create: s,
    });
  }
  console.log(`✓ ${settings.length} paramètres système`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@afritransfer.africa';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✓ Admin par défaut : ${email} (mot de passe : ${password})`);
}

async function main() {
  console.log('🌱 Amorçage AfriTransfer…');
  await seedCurrencies();
  await seedCountriesAndOperators();
  await seedSettings();
  await seedAdmin();
  console.log('✅ Amorçage terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Échec de l\'amorçage :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
