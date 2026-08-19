import styles from '../LandingPage.module.css';

function ConversationPreview() {
  return (
    <div aria-label="Example of an AI conversation" className={styles.demoCard}>
      <div className={styles.demoTop}>
        <span className={styles.onlineDot} /> Telegram <span className={styles.demoMenu}>•••</span>
      </div>
        <div className={styles.chat}>
        <div className={`${styles.message} ${styles.userMessage}`}>
          What needs my attention across Telegram?
        </div>
        <div className={`${styles.message} ${styles.aiMessage}`}>
          <Sparkles aria-hidden="true" className={styles.aiMark} size={13} />I found unread activity across your
          chats and channels. Here’s what looks most important…
        </div>
        <div className={`${styles.message} ${styles.userMessage} ${styles.shortMessage}`}>
          Show me the details from Product Team first
        </div>
        <div className={`${styles.message} ${styles.aiMessage}`}>
          There are two unread mentions and a new channel update. The team is waiting for your input on the launch
          date.
        </div>
      </div>
      <div className={styles.demoFooter}>
        <Sparkles aria-hidden="true" className={styles.spark} size={13} /> Powered by MCP
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>
          <span /> Your Telegram, your AI
        </p>
        <h1>Bring Telegram into your AI workflow</h1>
        <p className={styles.lead}>
          Bring the full Telegram experience into Claude or Codex. Your Telegram world, now part of your AI workspace.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.primaryButton} href="#install">
            Setup guide <ArrowDown aria-hidden="true" size={16} />
          </a>
        </div>
      </div>
      <ConversationPreview />
    </section>
  );
}
import { ArrowDown, Sparkles } from 'lucide-react';
