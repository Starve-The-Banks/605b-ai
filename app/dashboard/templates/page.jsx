"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TemplatesTab from '../components/TemplatesTab';

export default function TemplatesPage() {
  const router = useRouter();

  const logAction = useCallback((action, data) => {
    try {
      const existing = JSON.parse(localStorage.getItem('605b_audit_log') || '[]');
      localStorage.setItem(
        '605b_audit_log',
        JSON.stringify([...existing, { action, data, timestamp: new Date().toISOString() }].slice(-500))
      );
    } catch {
      /* ignore */
    }
  }, []);

  const addDispute = useCallback(
    (partial) => {
      const dateStr =
        partial.dateSent || new Date().toISOString().split('T')[0];
      const sentDate = new Date(dateStr);
      const deadline = new Date(sentDate);
      deadline.setDate(deadline.getDate() + 30);

      const newDispute = {
        ...partial,
        creditor: partial.creditor || partial.type || 'Dispute',
        bureau: partial.bureau || 'Experian',
        dateSent: dateStr,
        id: `dispute-${Date.now()}`,
        deadline: deadline.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('605b_disputes') || '[]');
        localStorage.setItem('605b_disputes', JSON.stringify([...existing, newDispute]));
      } catch {
        /* ignore */
      }

      logAction('DISPUTE_FROM_TEMPLATE', {
        templateId: partial.templateId,
        title: partial.type,
      });
      router.push('/dashboard/tracker');
    },
    [logAction, router]
  );

  return <TemplatesTab logAction={logAction} addDispute={addDispute} />;
}
