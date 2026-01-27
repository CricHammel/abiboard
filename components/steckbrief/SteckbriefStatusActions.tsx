'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

interface SteckbriefStatusActionsProps {
  status: 'DRAFT' | 'SUBMITTED';
}

export function SteckbriefStatusActions({ status }: SteckbriefStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetractDialog, setShowRetractDialog] = useState(false);

  const handleRetract = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/steckbrief/retract', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten.');
        setIsLoading(false);
        setShowRetractDialog(false);
        return;
      }

      setShowRetractDialog(false);
      router.refresh();
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setIsLoading(false);
      setShowRetractDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href="/steckbrief">
          <Button variant="primary" size="sm">
            Steckbrief bearbeiten
          </Button>
        </Link>

        {status === 'SUBMITTED' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRetractDialog(true)}
            loading={isLoading}
          >
            Zurückziehen
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRetractDialog}
        title="Einreichung zurückziehen"
        message="Möchtest du deinen Steckbrief als noch nicht fertig markieren?"
        confirmText="Zurückziehen"
        variant="warning"
        onConfirm={handleRetract}
        onCancel={() => setShowRetractDialog(false)}
        isLoading={isLoading}
      />
    </>
  );
}
