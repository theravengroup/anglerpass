'use client';

import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PermissionCategory {
  category: string;
  abilities: string[];
}

interface RolePermissionCardProps {
  label: string;
  description: string;
  permissions: PermissionCategory[];
  variant?: 'compact' | 'full';
  isActive?: boolean;
  isSelectable?: boolean;
  onSelect?: () => void;
  className?: string;
}

export default function RolePermissionCard({
  label,
  description,
  permissions,
  variant = 'compact',
  isActive = false,
  isSelectable = false,
  onSelect,
  className,
}: RolePermissionCardProps) {
  const [expanded, setExpanded] = useState(variant === 'full');
  const totalPermissions = permissions.reduce((sum, cat) => sum + cat.abilities.length, 0);

  const content = (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isActive
          ? 'border-river bg-river/5 ring-1 ring-river/20'
          : 'border-parchment bg-white',
        isSelectable && !isActive && 'cursor-pointer hover:border-stone-light',
        className,
      )}
      onClick={isSelectable ? onSelect : undefined}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onKeyDown={isSelectable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      } : undefined}
      aria-pressed={isSelectable ? isActive : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isSelectable && (
              <div className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                isActive
                  ? 'border-river bg-river text-white'
                  : 'border-stone-light',
              )}>
                {isActive && <Check className="size-2.5" />}
              </div>
            )}
            <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
          </div>
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{description}</p>
        </div>
        <span className="ml-3 shrink-0 rounded-full bg-parchment px-2 py-0.5 text-[11px] font-medium text-text-secondary">
          {totalPermissions} permissions
        </span>
      </div>

      {/* Expandable permission details */}
      {variant === 'compact' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-3 flex items-center gap-1 text-[11px] font-medium text-river hover:text-river/80"
          aria-label={expanded ? 'Hide permissions' : 'Show permissions'}
        >
          {expanded ? 'Hide details' : 'View permissions'}
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-parchment pt-3">
          {permissions.map((cat) => (
            <div key={cat.category}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-light">
                {cat.category}
              </p>
              <ul className="mt-1 space-y-0.5">
                {cat.abilities.map((ability) => (
                  <li key={ability} className="flex items-start gap-1.5 text-xs text-text-secondary">
                    <Check className="mt-0.5 size-3 shrink-0 text-forest" />
                    {ability}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return content;
}
