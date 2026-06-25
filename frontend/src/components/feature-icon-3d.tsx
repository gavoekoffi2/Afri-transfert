type FeatureIcon3DProps = {
  type: 'speed' | 'security' | 'transparent' | 'africa' | 'payment' | 'receipt';
};

const shell =
  'relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#ffffff,#eaf7f4_44%,#cceae4)] shadow-[0_18px_34px_rgba(15,23,42,.13),inset_0_1px_0_rgba(255,255,255,.92)] ring-1 ring-slate-200/80';
const glyph = 'relative h-8 w-8 drop-shadow-[0_8px_8px_rgba(15,23,42,.18)]';

export function FeatureIcon3D({ type }: FeatureIcon3DProps) {
  return (
    <div className={shell}>
      <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,.95),rgba(255,255,255,.25)_32%,rgba(255,255,255,0)_60%)]" />
      {type === 'speed' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <path d="M27 4 10 27h13l-3 17 18-25H25l2-15Z" fill="url(#featureGold)" />
          <Defs />
        </svg>
      )}
      {type === 'security' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <path d="M24 4 39 10v12c0 10-6.3 17.7-15 21-8.7-3.3-15-11-15-21V10l15-6Z" fill="url(#featureEmerald)" />
          <path d="m17 24 5 5 10-12" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Defs />
        </svg>
      )}
      {type === 'transparent' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <rect x="10" y="7" width="28" height="34" rx="8" fill="url(#featurePaper)" />
          <path d="M17 18h14M17 25h10M17 32h14" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="35" cy="34" r="7" fill="url(#featureGold)" />
          <Defs />
        </svg>
      )}
      {type === 'africa' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="url(#featureEmerald)" />
          <path d="M16 13c5 4 11 4 16 0M11 24h26M16 35c5-4 11-4 16 0M24 7c-4 5-6 10-6 17s2 12 6 17M24 7c4 5 6 10 6 17s-2 12-6 17" fill="none" stroke="white" strokeOpacity=".72" strokeWidth="2" strokeLinecap="round" />
          <Defs />
        </svg>
      )}
      {type === 'payment' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <rect x="7" y="14" width="34" height="23" rx="7" fill="url(#featureGold)" />
          <path d="M7 21h34" stroke="#7c4a00" strokeOpacity=".45" strokeWidth="4" />
          <circle cx="31" cy="30" r="4" fill="#0f766e" />
          <circle cx="36" cy="30" r="4" fill="#115e59" fillOpacity=".68" />
          <Defs />
        </svg>
      )}
      {type === 'receipt' && (
        <svg viewBox="0 0 48 48" className={glyph} aria-hidden="true">
          <path d="M13 6h22v36l-4-2.4-4 2.4-4-2.4-4 2.4-6-3.4V6Z" fill="url(#featurePaper)" />
          <path d="M19 17h12M19 24h12M19 31h8" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
          <Defs />
        </svg>
      )}
    </div>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="featureGold" x1="9" y1="4" x2="38" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff0b8" />
        <stop offset=".5" stopColor="#f4b423" />
        <stop offset="1" stopColor="#995900" />
      </linearGradient>
      <linearGradient id="featureEmerald" x1="8" y1="6" x2="39" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#dffff8" />
        <stop offset=".48" stopColor="#15b8aa" />
        <stop offset="1" stopColor="#06443f" />
      </linearGradient>
      <linearGradient id="featurePaper" x1="11" y1="7" x2="35" y2="41" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset=".62" stopColor="#dff5f0" />
        <stop offset="1" stopColor="#b9ddd5" />
      </linearGradient>
    </defs>
  );
}
