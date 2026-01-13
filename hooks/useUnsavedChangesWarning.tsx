'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface UseUnsavedChangesWarningResult {
  UnsavedChangesDialog: () => JSX.Element;
}

export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean
): UseUnsavedChangesWarningResult {
  const router = useRouter();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      // Find the closest anchor tag
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Only intercept internal links (not external or anchor links)
      if (href.startsWith('http') || href.startsWith('#') || href === pathname) {
        return;
      }

      // Prevent the default navigation
      e.preventDefault();
      e.stopPropagation();

      // Show confirmation dialog
      setNextUrl(href);
      setShowDialog(true);
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, pathname]);

  const handleConfirm = () => {
    if (nextUrl) {
      setShowDialog(false);
      // Navigate to the URL
      router.push(nextUrl);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setNextUrl(null);
  };

  const UnsavedChangesDialog = () => (
    <ConfirmDialog
      isOpen={showDialog}
      title="Ungespeicherte Änderungen"
      message="Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen? Alle Änderungen gehen verloren."
      confirmText="Verlassen"
      cancelText="Bleiben"
      variant="danger"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { UnsavedChangesDialog };
}
