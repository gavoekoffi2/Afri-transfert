'use client';

import { useEffect, useMemo, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useCountries, useDetectPhone, useQuote, useSendMoney } from '@/lib/hooks';
import { Quote } from '@/lib/types';

export default function SendMoneyPage() {
  const { data: countries } = useCountries();
  const quoteMutation = useQuote();
  const sendMutation = useSendMoney();

  const [senderIso2, setSenderIso2] = useState('CM');
  const [recipientIso2, setRecipientIso2] = useState('TG');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [amount, setAmount] = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');

  const detection = useDetectPhone(recipientPhone);
  const numericAmount = Number(amount);

  // Devis en temps réel (débounce léger sur le montant).
  useEffect(() => {
    setError('');
    if (!senderIso2 || !recipientIso2 || !numericAmount || numericAmount <= 0) {
      setQuote(null);
      return;
    }
    const handle = setTimeout(() => {
      quoteMutation.mutate(
        { senderCountryIso2: senderIso2, recipientCountryIso2: recipientIso2, amount: numericAmount },
        { onSuccess: setQuote, onError: (e) => setError(errorMessage(e)) },
      );
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderIso2, recipientIso2, amount]);

  const detectedOperators = detection.data?.operators ?? [];

  const canSubmit = useMemo(
    () => quote && recipientName.trim() && /^\+[1-9]\d{6,14}$/.test(recipientPhone),
    [quote, recipientName, recipientPhone],
  );

  async function onSend() {
    setError('');
    try {
      const tx = await sendMutation.mutateAsync({
        senderCountryIso2: senderIso2,
        recipientCountryIso2: recipientIso2,
        recipientName,
        recipientPhone,
        amount: numericAmount,
        operatorId: operatorId || undefined,
        saveBeneficiary,
      });
      // Redirection vers la page de paiement GeniusPay (checkout_url ou payment_url).
      const url = tx.paymentUrl ?? tx.checkoutUrl;
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Envoyer de l&apos;argent</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Formulaire */}
        <div className="card space-y-4 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pays d&apos;origine</label>
              <select className="input" value={senderIso2} onChange={(e) => setSenderIso2(e.target.value)}>
                {countries?.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pays du bénéficiaire</label>
              <select
                className="input"
                value={recipientIso2}
                onChange={(e) => setRecipientIso2(e.target.value)}
              >
                {countries?.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Nom du bénéficiaire</label>
            <input
              className="input"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ex: Awa Traoré"
            />
          </div>

          <div>
            <label className="label">Numéro Mobile Money</label>
            <input
              className="input"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+22890123456"
            />
            {detection.data?.country && (
              <p className="mt-1.5 text-xs text-brand-700">
                Détecté : {detection.data.country.flagEmoji} {detection.data.country.name}
              </p>
            )}
          </div>

          {detectedOperators.length > 0 && (
            <div>
              <label className="label">Opérateur (optionnel)</label>
              <select className="input" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                <option value="">Détection automatique (checkout)</option>
                {detectedOperators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Montant à envoyer</label>
            <input
              type="number"
              min={1}
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={saveBeneficiary}
              onChange={(e) => setSaveBeneficiary(e.target.checked)}
            />
            Enregistrer ce bénéficiaire
          </label>
        </div>

        {/* Récapitulatif des frais */}
        <div className="lg:col-span-2">
          <div className="card sticky top-6">
            <h2 className="text-lg font-bold">Récapitulatif</h2>
            {error && (
              <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {quote ? (
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Montant envoyé" value={formatMoney(quote.sendAmount, quote.sendCurrency)} />
                <Row label="Commission AfriTransfert" value={formatMoney(quote.commission, quote.sendCurrency)} />
                <Row label="Frais GeniusPay (est.)" value={formatMoney(quote.geniusPayFees, quote.sendCurrency)} />
                <div className="border-t border-slate-100 pt-3">
                  <Row
                    label="Total à payer"
                    value={formatMoney(quote.totalAmount, quote.sendCurrency)}
                    strong
                  />
                </div>
                <div className="rounded-xl bg-brand-50 px-4 py-3">
                  <Row
                    label="Montant reçu estimé"
                    value={formatMoney(quote.receiveAmount, quote.receiveCurrency)}
                    strong
                  />
                  {quote.fxRate !== 1 && (
                    <p className="mt-1 text-xs text-slate-500">Taux : 1 {quote.sendCurrency} = {quote.fxRate} {quote.receiveCurrency}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Saisissez un montant pour voir les frais en temps réel.
              </p>
            )}

            <button
              onClick={onSend}
              disabled={!canSubmit || sendMutation.isPending}
              className="btn-primary mt-6 w-full"
            >
              {sendMutation.isPending ? 'Envoi…' : 'Envoyer et payer'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Vous serez redirigé vers le paiement sécurisé GeniusPay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'font-semibold text-slate-800' : 'text-slate-500'}>{label}</span>
      <span className={strong ? 'text-base font-bold text-slate-900' : 'font-medium'}>{value}</span>
    </div>
  );
}
