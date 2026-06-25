import {
  calculateTransferFees,
  decimalsFor,
  estimateFxRate,
  roundTo,
} from './transfer-fees';

describe('calculateTransferFees', () => {
  it('applique la commission 2 % + 100 FCFA (exemple de référence)', () => {
    const result = calculateTransferFees({
      amount: 10000,
      sendCurrency: 'XOF',
      receiveCurrency: 'XOF',
      commissionPercent: 2,
      commissionFixed: 100,
    });

    // 2% de 10 000 = 200, + 100 = 300
    expect(result.commission).toBe(300);
    expect(result.sendAmount).toBe(10000);
    expect(result.totalAmount).toBe(10300); // sans frais GeniusPay (estimate = 0)
    expect(result.receiveAmount).toBe(10000); // XOF -> XOF, taux 1:1
    expect(result.fxRate).toBe(1);
  });

  it('inclut les frais GeniusPay estimés dans le total', () => {
    const result = calculateTransferFees({
      amount: 10000,
      sendCurrency: 'XOF',
      receiveCurrency: 'XOF',
      commissionPercent: 2,
      commissionFixed: 100,
      geniusPayFeePercentEstimate: 2.5,
    });
    expect(result.commission).toBe(300);
    expect(result.geniusPayFees).toBe(250); // 2.5% de 10 000
    expect(result.totalAmount).toBe(10550); // 10000 + 300 + 250
  });

  it('traite XOF -> XAF à parité 1:1 (deux monnaies indexées à l\'euro)', () => {
    const result = calculateTransferFees({
      amount: 5000,
      sendCurrency: 'XOF',
      receiveCurrency: 'XAF',
      commissionPercent: 2,
      commissionFixed: 100,
    });
    expect(result.fxRate).toBe(1);
    expect(result.receiveAmount).toBe(5000);
    expect(result.commission).toBe(200); // 2% de 5000 = 100, +100 = 200
  });

  it('convertit vers une devise à 2 décimales (XOF -> USD)', () => {
    const result = calculateTransferFees({
      amount: 6000,
      sendCurrency: 'XOF',
      receiveCurrency: 'USD',
      commissionPercent: 2,
      commissionFixed: 100,
    });
    // 6000 XOF / 600 = 10 USD
    expect(result.receiveCurrency).toBe('USD');
    expect(result.receiveAmount).toBe(10);
  });

  it('respecte un taux de change explicite', () => {
    const result = calculateTransferFees({
      amount: 1000,
      sendCurrency: 'XOF',
      receiveCurrency: 'CDF',
      commissionPercent: 2,
      commissionFixed: 100,
      fxRate: 4.7619,
    });
    expect(result.fxRate).toBe(4.7619);
    expect(result.receiveAmount).toBe(roundTo(1000 * 4.7619, 0));
  });

  it('arrondit la commission à la précision de la devise', () => {
    const result = calculateTransferFees({
      amount: 1234,
      sendCurrency: 'XOF',
      receiveCurrency: 'XOF',
      commissionPercent: 2,
      commissionFixed: 100,
    });
    // 2% de 1234 = 24,68 -> 25 ; + 100 = 125 (XOF = 0 décimale)
    expect(result.commission).toBe(125);
  });

  it('rejette les montants nuls ou négatifs', () => {
    expect(() =>
      calculateTransferFees({
        amount: 0,
        sendCurrency: 'XOF',
        receiveCurrency: 'XOF',
        commissionPercent: 2,
        commissionFixed: 100,
      }),
    ).toThrow();
    expect(() =>
      calculateTransferFees({
        amount: -10,
        sendCurrency: 'XOF',
        receiveCurrency: 'XOF',
        commissionPercent: 2,
        commissionFixed: 100,
      }),
    ).toThrow();
  });
});

describe('helpers de devise', () => {
  it('connaît les décimales par devise', () => {
    expect(decimalsFor('XOF')).toBe(0);
    expect(decimalsFor('XAF')).toBe(0);
    expect(decimalsFor('USD')).toBe(2);
    expect(decimalsFor('inconnu')).toBe(2);
  });

  it('estime un taux de change cohérent via le pivot XOF', () => {
    expect(estimateFxRate('XOF', 'XOF')).toBe(1);
    expect(estimateFxRate('XOF', 'XAF')).toBe(1);
    expect(estimateFxRate('XAF', 'XOF')).toBe(1);
    expect(estimateFxRate('XOF', 'USD')).toBeCloseTo(1 / 600, 6);
  });

  it('arrondit demi-vers-le-haut', () => {
    expect(roundTo(24.5, 0)).toBe(25);
    expect(roundTo(10.005, 2)).toBe(10.01);
  });
});
