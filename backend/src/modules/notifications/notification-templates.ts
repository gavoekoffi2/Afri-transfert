/**
 * Gabarits de messages (email/SMS). Centralisés pour faciliter la traduction future
 * (FR/EN/PT) et la cohérence de la marque AfriTransfer.
 */

export interface RenderedMessage {
  subject: string;
  body: string;
}

const brand = (inner: string) =>
  `<div style="font-family:sans-serif;max-width:560px;margin:auto">
    <h2 style="color:#0f766e">🌍 AfriTransfer</h2>
    ${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#888;font-size:12px">Envoyez de l'argent partout en Afrique, simplement.</p>
  </div>`;

export const Templates = {
  emailVerification(name: string, url: string): RenderedMessage {
    return {
      subject: 'Vérifiez votre adresse email — AfriTransfer',
      body: brand(
        `<p>Bonjour ${name},</p>
         <p>Bienvenue sur AfriTransfer ! Confirmez votre adresse email pour activer votre compte :</p>
         <p><a href="${url}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Vérifier mon email</a></p>
         <p>Ce lien expire dans 24 heures.</p>`,
      ),
    };
  },

  welcome(name: string): RenderedMessage {
    return {
      subject: 'Bienvenue sur AfriTransfer 🎉',
      body: brand(
        `<p>Bonjour ${name},</p>
         <p>Votre compte est vérifié. Vous pouvez dès maintenant envoyer de l'argent partout en Afrique.</p>`,
      ),
    };
  },

  passwordReset(name: string, url: string): RenderedMessage {
    return {
      subject: 'Réinitialisation de votre mot de passe — AfriTransfer',
      body: brand(
        `<p>Bonjour ${name},</p>
         <p>Vous avez demandé à réinitialiser votre mot de passe :</p>
         <p><a href="${url}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Réinitialiser</a></p>
         <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
      ),
    };
  },

  phoneOtp(code: string): string {
    return `AfriTransfer : votre code de vérification est ${code}. Il expire dans 10 minutes.`;
  },

  transactionInitiated(ref: string, amount: string): RenderedMessage {
    return {
      subject: `Transfert initié — ${ref}`,
      body: brand(`<p>Votre transfert de <b>${amount}</b> (réf. ${ref}) a été initié et est en attente de paiement.</p>`),
    };
  },

  transactionSuccess(ref: string, amount: string, recipient: string): RenderedMessage {
    return {
      subject: `Transfert réussi ✅ — ${ref}`,
      body: brand(
        `<p>Bonne nouvelle ! Votre transfert de <b>${amount}</b> à <b>${recipient}</b> (réf. ${ref}) a été effectué avec succès.</p>`,
      ),
    };
  },

  transactionFailed(ref: string, reason: string): RenderedMessage {
    return {
      subject: `Échec du transfert ❌ — ${ref}`,
      body: brand(`<p>Votre transfert (réf. ${ref}) n'a pas abouti. Motif : ${reason}. Aucun montant n'a été débité.</p>`),
    };
  },

  transactionRefunded(ref: string, amount: string): RenderedMessage {
    return {
      subject: `Remboursement — ${ref}`,
      body: brand(`<p>Votre transfert (réf. ${ref}) a été remboursé pour un montant de <b>${amount}</b>.</p>`),
    };
  },
};
