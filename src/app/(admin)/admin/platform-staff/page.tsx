import type { Metadata } from 'next';
import PlatformStaffManager from '@/components/admin/PlatformStaffManager';

export const metadata: Metadata = {
  title: 'Platform Staff — AnglerPass Admin',
};

export default function PlatformStaffPage() {
  return <PlatformStaffManager />;
}
