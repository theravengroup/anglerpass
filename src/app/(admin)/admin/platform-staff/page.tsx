import type { Metadata } from 'next';
import PlatformStaffManager from '@/components/admin/PlatformStaffManager';
import AdminPageGuard from '@/components/admin/AdminPageGuard';

export const metadata: Metadata = {
  title: 'Platform Staff — AnglerPass Admin',
};

export default function PlatformStaffPage() {
  return (
    <AdminPageGuard path="/admin/platform-staff">
      <PlatformStaffManager />
    </AdminPageGuard>
  );
}
