import Link from 'next/link';

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function AfriTransferLogo({ href = '/', compact = false, className = '' }: BrandMarkProps) {
  const content = (
    <>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#ffffff_0,#d9fff8_18%,#17c8b8_43%,#0f766e_70%,#063b36_100%)] shadow-[0_18px_42px_rgba(13,148,136,.38),inset_0_1px_1px_rgba(255,255,255,.75)] ring-1 ring-white/35">
        <span className="absolute inset-[5px] rounded-[1.05rem] bg-[linear-gradient(145deg,rgba(255,255,255,.62),rgba(255,255,255,0)_45%)]" />
        <svg viewBox="0 0 42 42" aria-hidden="true" className="relative h-8 w-8 drop-shadow-[0_8px_10px_rgba(0,0,0,.22)]">
          <defs>
            <linearGradient id="afriGold" x1="8" y1="6" x2="32" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE6A3" />
              <stop offset="0.48" stopColor="#F7B731" />
              <stop offset="1" stopColor="#A76500" />
            </linearGradient>
            <linearGradient id="afriEmerald" x1="6" y1="8" x2="36" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EBFFFB" />
              <stop offset="0.45" stopColor="#22D3C5" />
              <stop offset="1" stopColor="#075E54" />
            </linearGradient>
          </defs>
          <path d="M21 3.5c8.2 0 14.9 6.7 14.9 14.9S29.2 33.3 21 33.3 6.1 26.6 6.1 18.4 12.8 3.5 21 3.5Z" fill="url(#afriEmerald)" />
          <path d="M10.8 9.8c2.7 2.1 5.8 3.1 9.2 3.1h2.3c3.4 0 6.4 1 9.1 3.1M7.4 18.4h27.2M10.8 27c2.7-2.1 5.8-3.1 9.2-3.1h2.3c3.4 0 6.4-1 9.1-3.1M21 4.2c-3.2 3.7-4.8 8.4-4.8 14.2S17.8 28.9 21 32.6M21 4.2c3.2 3.7 4.8 8.4 4.8 14.2S24.2 28.9 21 32.6" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M26.5 29.2c4.7-1.6 8.9-5.6 10.2-10.5.3-1.2 2-.9 1.9.3-.6 6.1-5 11.2-10.8 13.2l1.2 2.1c.5.9-.5 1.9-1.4 1.4l-7-4.1c-.8-.5-.7-1.7.2-2l7.8-2.3c1-.3 1.7.9 1 1.6l-3.1.3Z" fill="url(#afriGold)" stroke="rgba(255,255,255,.55)" strokeWidth=".55" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[1.08rem] font-black tracking-[-0.035em] text-white">AfriTransfer</span>
          <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-amber-200/90">Money across Africa</span>
        </span>
      )}
    </>
  );

  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`} aria-label="AfriTransfer accueil">
      {content}
    </Link>
  );
}
