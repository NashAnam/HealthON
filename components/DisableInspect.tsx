'use client';

import { useEffect } from 'react';

/**
 * Prevents basic inspection shortcuts/context menu access in the browser.
 * While dev tools can still be opened manually, this blocks the common paths.
 */
export default function DisableInspect() {
  useEffect(() => {
    const blockContextMenu = (event: Event) => {
      event.preventDefault();
    };

    const blockShortcuts = (event: KeyboardEvent) => {
      const key = event.key?.toUpperCase();
      const blocked =
        key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(key)) ||
        (event.ctrlKey && key === 'U');

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts, true);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts, true);
    };
  }, []);

  return null;
}

