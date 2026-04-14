'use client';

import { useState, type ReactNode } from 'react';
import ContactModal from '@/components/shared/ContactModal';
import CorporateInquiryForm from '@/components/shared/CorporateInquiryForm';

export default function CorporateInquiryCta({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <ContactModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Request a Corporate Proposal"
      >
        <CorporateInquiryForm onSuccess={() => setOpen(false)} />
      </ContactModal>
    </>
  );
}
