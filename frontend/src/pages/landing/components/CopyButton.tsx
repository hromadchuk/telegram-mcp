import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import styles from '../LandingPage.module.css';

type CopyButtonProps = { value: string };

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button aria-label={copied ? 'Copied' : 'Copy command'} className={styles.copyButton} onClick={copy} type="button">
      {copied ? <Check aria-hidden="true" size={13} /> : <Copy aria-hidden="true" size={13} />}
    </button>
  );
}
