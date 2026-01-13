'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  const router = useRouter();
  const pathname = usePathname();

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

      // Show native browser confirm dialog
      const shouldLeave = window.confirm(
        'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen? Alle Änderungen gehen verloren.'
      );

      if (shouldLeave) {
        // Navigate to the URL
        router.push(href);
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, pathname, router]);
}
