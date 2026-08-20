import githubLogo from '@/assets/logos/github.svg';
import mtcuteLogo from '@/assets/logos/mtcute.png';
import { ExternalLink, Heart } from 'lucide-react';

import styles from '../LandingPage.module.css';
import { BrandMark } from './BrandMark';

type ProjectFooterProps = { repositoryUrl: string };

export function ProjectFooter({ repositoryUrl }: ProjectFooterProps) {
  return (
    <>
      <section aria-label="Project details" className={styles.projectCards}>
        <div className={styles.projectCard}>
          <div className={styles.projectCardIcon}>
            <img alt="" className={styles.buttonGithubLogo} src={githubLogo} />
          </div>
          <div className={styles.projectCardContent}>
            <h2>Open source</h2>
            <p>Self-host it, inspect the code, or contribute.</p>
          </div>
          <a className={styles.projectCardLink} href={repositoryUrl} rel="noreferrer" target="_blank">
            GitHub <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
        <div className={styles.projectCard}>
          <div className={styles.projectCardIcon}>
            <img alt="mtcute" className={styles.mtcuteLogo} src={mtcuteLogo} />
          </div>
          <div className={styles.projectCardContent}>
            <h2>Built with mtcute</h2>
            <p>Modern TypeScript access to the Telegram MTProto API.</p>
          </div>
          <a className={styles.projectCardLink} href="https://mtcute.dev/" rel="noreferrer" target="_blank">
            mtcute.dev <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      </section>
      <footer className={styles.footer}>
        <a className={styles.brand} href="#top">
          <BrandMark />
          <span>Telegram MCP</span>
        </a>
        <span>
          Made with l
          <Heart aria-hidden="true" className={styles.heartAnimation} size={9} strokeWidth={2.5} />
          ve by{' '}
          <a className={styles.footerCreatorLink} href="https://hro.sh" rel="noreferrer" target="_blank">
            Pavlo Hromadchuk
          </a>
        </span>
        <a href={repositoryUrl} rel="noreferrer" target="_blank">
          <img alt="" className={styles.footerGithubLogo} src={githubLogo} /> GitHub{' '}
          <ExternalLink aria-hidden="true" size={12} />
        </a>
      </footer>
    </>
  );
}
