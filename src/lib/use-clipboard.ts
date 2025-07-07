import { useState, useCallback } from 'react';

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API not available');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  }, [timeout]);

  return { copy, copied };
} 