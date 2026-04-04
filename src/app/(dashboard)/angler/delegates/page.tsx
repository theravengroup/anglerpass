import type { Metadata } from 'next';
import DelegateManager from '@/components/angler/DelegateManager';

export const metadata: Metadata = {
  title: 'Delegates — AnglerPass',
};

export default function DelegatesPage() {
  return <DelegateManager />;
}
