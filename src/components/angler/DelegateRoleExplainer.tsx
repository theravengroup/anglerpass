import { Eye, PenLine, Check } from 'lucide-react';
import {
  DELEGATE_LEVEL_LABELS,
  DELEGATE_LEVEL_DESCRIPTIONS,
  DELEGATE_PERMISSION_SUMMARIES,
  type DelegateLevel,
} from '@/lib/permissions/constants';

const LEVEL_CONFIG: Record<DelegateLevel, { icon: typeof Eye; bg: string; text: string; border: string }> = {
  viewer: { icon: Eye, bg: 'bg-river/5', text: 'text-river', border: 'border-river/20' },
  booking_manager: { icon: PenLine, bg: 'bg-bronze/5', text: 'text-bronze', border: 'border-bronze/20' },
};

export default function DelegateRoleExplainer() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['viewer', 'booking_manager'] as const).map((level) => {
        const config = LEVEL_CONFIG[level];
        const Icon = config.icon;

        return (
          <div
            key={level}
            className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`rounded-full p-1.5 ${config.text} bg-white/80`}>
                <Icon className="size-4" />
              </div>
              <h4 className={`text-sm font-semibold ${config.text}`}>
                {DELEGATE_LEVEL_LABELS[level]}
              </h4>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              {DELEGATE_LEVEL_DESCRIPTIONS[level]}
            </p>
            <ul className="space-y-1">
              {DELEGATE_PERMISSION_SUMMARIES[level].map((perm) => (
                <li key={perm} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <Check className="mt-0.5 size-3 shrink-0 text-forest" />
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
