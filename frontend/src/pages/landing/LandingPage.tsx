import { useState } from 'react';

import { FeaturesSection } from './components/FeaturesSection';
import { HeroSection } from './components/HeroSection';
import { LandingHeader } from './components/LandingHeader';
import { ProjectFooter } from './components/ProjectFooter';
import { SetupSection } from './components/SetupSection';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const [origin] = useState(() => window.location.origin);
  const mcpUrl = `${origin}/mcp`;
  const repositoryUrl = 'https://github.com/hromadchuk/telegram-mcp';

  return (
    <main className={styles.page}>
      <LandingHeader repositoryUrl={repositoryUrl} />
      <HeroSection />
      <FeaturesSection />
      <SetupSection mcpUrl={mcpUrl} />
      <ProjectFooter repositoryUrl={repositoryUrl} />
    </main>
  );
}
