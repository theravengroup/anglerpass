'use client';

import { Shield, Eye, PenLine, Users, BookOpen, BarChart3, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CLUB_ROLE_LABELS,
  PLATFORM_ROLE_LABELS,
  DELEGATE_LEVEL_LABELS,
  type ClubRole,
  type PlatformRole,
  type DelegateLevel,
} from '@/lib/permissions/constants';

type RoleBadgeProps = {
  role: string;
  scope: 'platform' | 'organization' | 'consumer';
  size?: 'sm' | 'md';
};

const CLUB_ROLE_STYLES: Partial<Record<ClubRole, { icon: typeof Shield; bg: string; text: string }>> = {
  owner: { icon: Shield, bg: 'bg-river/10', text: 'text-river' },
  admin: { icon: Shield, bg: 'bg-river/10', text: 'text-river' },
  club_admin: { icon: Users, bg: 'bg-river/10', text: 'text-river' },
  booking_staff: { icon: BookOpen, bg: 'bg-forest/10', text: 'text-forest' },
  ops_staff: { icon: Users, bg: 'bg-forest/10', text: 'text-forest' },
  staff: { icon: Users, bg: 'bg-forest/10', text: 'text-forest' },
  finance_staff: { icon: BarChart3, bg: 'bg-forest/10', text: 'text-forest' },
  readonly_staff: { icon: Lock, bg: 'bg-stone/10', text: 'text-stone' },
  member: { icon: Users, bg: 'bg-parchment', text: 'text-text-secondary' },
};

export default function RoleBadge({ role, scope, size = 'sm' }: RoleBadgeProps) {
  if (scope === 'consumer') {
    const level = role as DelegateLevel;
    const Icon = level === 'viewer' ? Eye : PenLine;
    const label = DELEGATE_LEVEL_LABELS[level] ?? role;
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        level === 'viewer' ? 'bg-river/10 text-river' : 'bg-bronze/10 text-bronze',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}>
        <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} />
        {label}
      </span>
    );
  }

  if (scope === 'platform') {
    const label = PLATFORM_ROLE_LABELS[role as PlatformRole] ?? role;
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full bg-charcoal/10 font-medium text-charcoal',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}>
        <Shield className={size === 'sm' ? 'size-3' : 'size-3.5'} />
        {label}
      </span>
    );
  }

  // Organization (club) scope
  const clubRole = role as ClubRole;
  const style = CLUB_ROLE_STYLES[clubRole] ?? { icon: Users, bg: 'bg-stone/10', text: 'text-stone' };
  const label = CLUB_ROLE_LABELS[clubRole] ?? role;
  const Icon = style.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      style.bg,
      style.text,
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
    )}>
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      {label}
    </span>
  );
}
