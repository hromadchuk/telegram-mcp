import { CopyButton } from './CopyButton';
import styles from '../LandingPage.module.css';

type SetupSectionProps = { mcpUrl: string };
type InstallOption = { title: string; subtitle: string; steps: string[]; command: string; logo: string };

function CodeSnippet({ value }: { value: string }) {
  return (
    <div className={styles.codeSnippet}>
      <code>{value}</code>
      <CopyButton value={value} />
    </div>
  );
}

function InstallSteps({ steps, command }: Pick<InstallOption, 'steps' | 'command'>) {
  const [firstStep, secondStep, ...remainingSteps] = steps;

  return (
    <>
      <ol className={styles.installSteps}>
        <li>{firstStep}</li>
        <li>{secondStep}</li>
      </ol>
      <CodeSnippet value={command} />
      <ol className={styles.installSteps} start={3}>
        {remainingSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </>
  );
}

export function SetupSection({ mcpUrl }: SetupSectionProps) {
  const options: InstallOption[] = [
    {
      title: 'Claude',
      subtitle: 'Pro, Max, Team, or Enterprise',
      steps: [
        'Open Settings → Connectors.',
        'Choose Add custom connector and paste the server URL.',
        'Click Connect and sign in to Telegram.',
        'Start a new chat and ask Claude about Telegram.',
      ],
      command: mcpUrl,
      logo: claudeLogo,
    },
    {
      title: 'Codex',
      subtitle: 'CLI or app',
      steps: [
        'Start a new task.',
        'Ask Codex to add the remote MCP server using the prompt below.',
        'Approve the config change.',
        'Open Telegram MCP and sign in.',
      ],
      command: `Add this remote MCP server: ${mcpUrl}`,
      logo: codexLogo,
    },
  ];

  return (
    <section className={styles.install} id="install">
      <div className={styles.sectionHeading}>
        <p className={styles.sectionKicker}>Quick start</p>
        <h2>Connected in under a minute.</h2>
        <p>Choose your AI client, add the MCP server, then sign in to Telegram.</p>
      </div>
      <div className={styles.installGrid}>
        {options.map(({ title, subtitle, steps, command, logo }) => (
          <article className={styles.installCard} key={title}>
            <div className={styles.installTitle}>
              <span className={styles.clientLogo}>
                <img alt={`${title} logo`} className={title === 'Codex' ? styles.codexLogo : undefined} src={logo} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{subtitle}</p>
              </div>
            </div>
            <InstallSteps command={command} steps={steps} />
          </article>
        ))}
      </div>
      <p className={styles.installHint}>
        After adding the server, you’ll be redirected to sign in with your Telegram API ID and API Hash.
      </p>
    </section>
  );
}
import claudeLogo from '@/assets/logos/claude.svg';
import codexLogo from '@/assets/logos/codex.svg';
