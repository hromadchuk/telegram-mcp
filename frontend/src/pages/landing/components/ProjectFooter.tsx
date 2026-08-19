import githubLogo from '@/assets/logos/github.svg';
import { ExternalLink } from 'lucide-react';

import styles from '../LandingPage.module.css';
import { BrandMark } from './BrandMark';

type ProjectFooterProps = { repositoryUrl: string };

export function ProjectFooter({ repositoryUrl }: ProjectFooterProps) {
  return (
    <>
      <section className={styles.opensource}>
        <div>
          <p className={styles.sectionKicker}>Open source</p>
          <h2>
            Open source.
            <br />
            Your rules.
          </h2>
        </div>
        <div className={styles.opensourceCopy}>
          <p>
            Open source, transparent, and yours to build on. Self-host Telegram MCP or contribute to its future.
          </p>
          <a className={styles.darkButton} href={repositoryUrl} rel="noreferrer" target="_blank">
            <img alt="" className={styles.buttonGithubLogo} src={githubLogo} />
            View on GitHub <ExternalLink aria-hidden="true" size={16} />
          </a>
        </div>
      </section>
      <footer className={styles.footer}>
        <a className={styles.brand} href="#top">
          <BrandMark />
          <span>Telegram MCP</span>
        </a>
        <span>The bridge between Telegram and AI</span>
        <a href={repositoryUrl} rel="noreferrer" target="_blank">
          <img alt="" className={styles.footerGithubLogo} src={githubLogo} /> GitHub{' '}
          <ExternalLink aria-hidden="true" size={12} />
        </a>
      </footer>
    </>
  );
}
