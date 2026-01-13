'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface SteckbriefStatusActionsProps {
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

export function SteckbriefStatusActions({ status }: SteckbriefStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetract = async () => {
    if (!confirm('Möchtest du deine Einreichung wirklich zurückziehen? Du kannst den Steckbrief danach wieder bearbeiten.')) {
      return;
    }

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
        return;
      }

      // Success - refresh the page
      router.refresh();
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      {status === 'DRAFT' && (
        <Link href="/steckbrief">
          <Button variant="primary">Steckbrief bearbeiten</Button>
        </Link>
      )}

      {status === 'SUBMITTED' && (
        <Button
          variant="secondary"
          onClick={handleRetract}
          loading={isLoading}
        >
          Einreichung zurückziehen
        </Button>
      )}

      {status === 'APPROVED' && (
        <Link href="/steckbrief">
          <Button variant="secondary">Steckbrief ansehen</Button>
        </Link>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
