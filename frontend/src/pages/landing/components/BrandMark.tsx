import telegramMcpLogo from '@/assets/logos/telegram-mcp.svg';

import styles from '../LandingPage.module.css';

export function BrandMark() {
  return <img alt="Telegram MCP" className={styles.brandMark} src={telegramMcpLogo} />;
}
