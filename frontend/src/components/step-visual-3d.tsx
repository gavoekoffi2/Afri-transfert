type StepVisualProps = {
  type: 'choose' | 'verify' | 'pay' | 'confirm';
};

const baseClass =
  'relative h-20 w-20 rounded-[1.55rem] bg-[linear-gradient(145deg,#ffffff,#edf7f5_40%,#c9e8e2)] shadow-[0_24px_48px_rgba(15,23,42,.16),inset_0_1px_0_rgba(255,255,255,.9)] ring-1 ring-slate-200/70 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-2deg] group-hover:shadow-[0_30px_60px_rgba(15,118,110,.23),inset_0_1px_0_rgba(255,255,255,.95)]';

export function StepVisual3D({ type }: StepVisualProps) {
  if (type === 'choose') return <ChooseVisual />;
  if (type === 'verify') return <VerifyVisual />;
  if (type === 'pay') return <PayVisual />;
  return <ConfirmVisual />;
}

function Shine() {
  return <span className="pointer-events-none absolute inset-0 rounded-[1.55rem] bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,.98),rgba(255,255,255,.45)_18%,rgba(255,255,255,0)_48%)]" />;
}

function ChooseVisual() {
  return (
    <div className={baseClass}>
      <Shine />
      <div className="absolute left-3.5 top-3.5 h-12 w-12 rounded-full bg-[radial-gradient(circle_at_30%_25%,#f7fffd,#1dd6c4_42%,#0f766e_72%,#073f3a)] shadow-[inset_-8px_-10px_18px_rgba(0,0,0,.18),0_12px_22px_rgba(13,148,136,.28)]" />
      <div className="absolute left-5 top-8 h-1 w-9 rotate-[-12deg] rounded-full bg-white/75" />
      <div className="absolute left-8 top-4 h-9 w-1 rotate-[14deg] rounded-full bg-white/55" />
      <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#ffe8a3,#f6b21a_55%,#a76000)] shadow-[0_12px_22px_rgba(180,102,0,.34),inset_0_1px_0_rgba(255,255,255,.65)]">
        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,.28)]" />
      </div>
    </div>
  );
}

function VerifyVisual() {
  return (
    <div className={baseClass}>
      <Shine />
      <div className="absolute left-4 top-3 h-14 w-12 rotate-[-4deg] rounded-2xl bg-[linear-gradient(160deg,#ffffff,#e9f7f4)] p-2 shadow-[0_14px_26px_rgba(15,23,42,.16),inset_0_1px_0_rgba(255,255,255,.9)] ring-1 ring-slate-200">
        <div className="mb-2 h-1.5 w-7 rounded-full bg-slate-300" />
        <div className="mb-1.5 h-1.5 w-8 rounded-full bg-emerald-300" />
        <div className="mb-1.5 h-1.5 w-6 rounded-full bg-amber-300" />
        <div className="h-1.5 w-9 rounded-full bg-slate-200" />
      </div>
      <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#103d38,#0f766e_45%,#2dd4bf)] shadow-[0_14px_28px_rgba(13,148,136,.34),inset_0_1px_0_rgba(255,255,255,.35)]">
        <span className="text-lg font-black text-white drop-shadow">%</span>
      </div>
    </div>
  );
}

function PayVisual() {
  return (
    <div className={baseClass}>
      <Shine />
      <div className="absolute left-5 top-3 h-[3.8rem] w-10 rotate-[6deg] rounded-[1.1rem] bg-[linear-gradient(160deg,#1e293b,#0f766e_55%,#14b8a6)] shadow-[0_18px_28px_rgba(15,23,42,.25),inset_0_1px_0_rgba(255,255,255,.35)] ring-2 ring-white/60">
        <div className="mx-auto mt-1.5 h-1 w-4 rounded-full bg-white/45" />
        <div className="mx-auto mt-3 h-7 w-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,#f8d577_45%,#b87300)] shadow-inner" />
        <div className="mx-auto mt-2 h-1.5 w-5 rounded-full bg-white/35" />
      </div>
      <div className="absolute bottom-4 right-2 h-8 w-12 -rotate-6 rounded-xl bg-[linear-gradient(145deg,#fff7d6,#f4b82b)] shadow-[0_12px_22px_rgba(180,102,0,.28)] ring-1 ring-amber-200">
        <div className="absolute left-2 top-2 h-1.5 w-8 rounded bg-amber-700/25" />
        <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-600" />
      </div>
    </div>
  );
}

function ConfirmVisual() {
  return (
    <div className={baseClass}>
      <Shine />
      <div className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_28%_22%,#f0fff9,#34d399_38%,#0f766e_78%)] shadow-[0_18px_32px_rgba(13,148,136,.35),inset_-9px_-12px_20px_rgba(0,0,0,.14)]">
        <svg viewBox="0 0 48 48" className="h-9 w-9 drop-shadow-[0_6px_8px_rgba(0,0,0,.2)]" aria-hidden="true">
          <path d="M14 24.8 21 32 35 16" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute -right-1 bottom-4 h-6 w-6 rounded-full bg-[linear-gradient(145deg,#fff2b4,#e7a80c)] shadow-[0_10px_18px_rgba(180,102,0,.3)]" />
      <div className="absolute right-3 top-4 h-3 w-3 rounded-full bg-white/80 shadow" />
    </div>
  );
}
