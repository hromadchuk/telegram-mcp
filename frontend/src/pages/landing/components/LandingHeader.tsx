import githubLogo from '@/assets/logos/github.svg';
import { ExternalLink } from 'lucide-react';

import styles from '../LandingPage.module.css';
import { BrandMark } from './BrandMark';

type LandingHeaderProps = { repositoryUrl: string };

export function LandingHeader({ repositoryUrl }: LandingHeaderProps) {
  return (
    <nav aria-label="Main navigation" className={styles.nav}>
      <a aria-label="Telegram MCP home" className={styles.brand} href="#top">
        <BrandMark />
        <span>Telegram MCP</span>
      </a>
      <div className={styles.navActions}>
        <a className={styles.githubLink} href={repositoryUrl} rel="noreferrer" target="_blank">
          <img alt="" src={githubLogo} /> GitHub <ExternalLink aria-hidden="true" size={13} />
        </a>
      </div>
    </nav>
  );
}
