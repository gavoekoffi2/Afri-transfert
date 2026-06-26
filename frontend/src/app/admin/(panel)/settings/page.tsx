'use client';

import { useEffect, useState } from 'react';
import { AdminSetting, useAdminSettings, useUpdateSetting } from '@/lib/admin-hooks';

const GROUP_LABELS: Record<string, string> = {
  commission: 'Commissions',
  geniuspay: 'GeniusPay',
  general: 'Général',
};

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateSetting();

  const grouped = (settings ?? []).reduce<Record<string, AdminSetting[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commissions &amp; configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modifiez la commission AfriTransfer (2 % + 100 FCFA), les limites et la configuration GeniusPay.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">{GROUP_LABELS[group] ?? group}</h2>
            <div className="space-y-3">
              {items.map((s) => (
                <SettingRow
                  key={s.key}
                  setting={s}
                  saving={update.isPending}
                  onSave={(value) => update.mutate({ key: s.key, value })}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
  saving,
}: {
  setting: AdminSetting;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(setting.value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(setting.value);
    setDirty(false);
  }, [setting.value]);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-semibold text-slate-700">{setting.key}</p>
        {setting.description && <p className="text-xs text-slate-400">{setting.description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="input w-40 py-2"
          value={setting.isSecret ? '••••••••' : value}
          disabled={setting.isSecret}
          onChange={(e) => {
            setValue(e.target.value);
            setDirty(e.target.value !== setting.value);
          }}
        />
        <button
          onClick={() => onSave(value)}
          disabled={!dirty || saving || setting.isSecret}
          className="btn-primary px-4 py-2 text-xs"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
