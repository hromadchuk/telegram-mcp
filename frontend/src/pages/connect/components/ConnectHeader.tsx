import telegramMcpLogo from '@/assets/logos/telegram-mcp.svg';
import { ArrowLeft } from 'lucide-react';

import styles from '../ConnectPage.module.css';

export function ConnectHeader() {
  return (
    <header className={styles.header}>
      <a aria-label="Telegram MCP home" className={styles.brand} href="/">
        <img alt="" className={styles.brandMark} src={telegramMcpLogo} />
        <span>Telegram MCP</span>
      </a>
      <a className={styles.backLink} href="/">
        <ArrowLeft aria-hidden="true" size={15} /> Back to home
      </a>
    </header>
  );
}
