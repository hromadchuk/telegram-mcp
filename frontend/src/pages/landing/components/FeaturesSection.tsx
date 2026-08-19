import { Network, Search, ShieldCheck, type LucideIcon } from 'lucide-react';

import styles from '../LandingPage.module.css';

const features = [
  {
    icon: Search,
    title: 'Your Telegram, in context',
    description: 'Give your AI the full picture behind the conversations that matter.',
  },
  {
    icon: Network,
    title: 'More than a chat',
    description: 'Work across people, groups, channels, media, and everything in between.',
  },
  {
    icon: ShieldCheck,
    title: 'Built around control',
    description: 'Connect securely and keep ownership of your account and data.',
  },
] satisfies { icon: LucideIcon; title: string; description: string }[];

export function FeaturesSection() {
  return (
    <section aria-label="Capabilities" className={styles.features}>
      {features.map(({ icon: Icon, title, description }) => (
        <article key={title}>
          <Icon aria-hidden="true" className={styles.featureIcon} size={22} strokeWidth={1.8} />
          <h2>{title}</h2>
          <p>{description}</p>
        </article>
      ))}
    </section>
  );
}
