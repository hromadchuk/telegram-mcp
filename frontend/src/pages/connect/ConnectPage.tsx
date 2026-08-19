import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { MemoryStorage, TelegramClient, tl } from '@mtcute/web';

import { QrCode } from './QrCode';
import { ConnectHeader } from './components/ConnectHeader';
import styles from './ConnectPage.module.css';

type Step = 'credentials' | 'qr' | 'password';

interface OAuthAuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
  scope?: string;
  state?: string;
}

interface ParsedAuthorizationRequest {
  value: OAuthAuthorizationRequest | null;
  error: string | null;
}

interface PasswordRequest {
  resolve: (password: string) => void;
  reject: (reason: unknown) => void;
}

export function ConnectPage() {
  const clientRef = useRef<TelegramClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const passwordRequestRef = useRef<PasswordRequest | null>(null);
  const [authorizationRequest] = useState(parseAuthorizationRequest);
  const [step, setStep] = useState<Step>('credentials');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(authorizationRequest.error);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      abortConnection();
      void clientRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (step !== 'qr' || !qrExpiresAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [qrExpiresAt, step]);

  if (!authorizationRequest.value) {
    return <Navigate replace to="/" />;
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await destroyClient();

      const numericApiId = Number(apiId);

      if (!Number.isInteger(numericApiId) || numericApiId <= 0) {
        throw new Error('API ID must be a positive integer.');
      }

      const client = new TelegramClient({
        apiId: numericApiId,
        apiHash: apiHash.trim(),
        storage: new MemoryStorage(),
      });
      const abortController = new AbortController();

      clientRef.current = client;
      abortControllerRef.current = abortController;
      setQrScanned(false);
      setQrUrl('');
      setQrExpiresAt(null);

      await client.signInQr({
        abortSignal: abortController.signal,
        onUrlUpdated: (url, expires) => {
          setQrUrl(url);
          setQrExpiresAt(expires);
          setNow(Date.now());
          setStep('qr');
          setLoading(false);
        },
        onQrScanned: () => {
          setQrScanned(true);
        },
        password: requestPassword,
        invalidPasswordCallback: () => {
          setPassword('');
          setError('The two-step verification password is invalid.');
          setLoading(false);
        },
      });

      await finish();
    } catch (reason) {
      if (!isAbortError(reason)) {
        setError(getErrorMessage(reason));
        setStep('credentials');
        await destroyClient();
      }
    } finally {
      setLoading(false);
    }
  }

  function requestPassword(): Promise<string> {
    setStep('password');
    setLoading(false);

    return new Promise((resolve, reject) => {
      passwordRequestRef.current = { resolve, reject };
    });
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request = passwordRequestRef.current;

    if (!request) {
      setError('Telegram connection was lost. Start again.');

      return;
    }

    passwordRequestRef.current = null;
    setError(null);
    setLoading(true);
    request.resolve(password);
  }

  async function finish() {
    const client = requireClient();
    const session = await client.exportSession();
    const request = authorizationRequest.value;

    if (!request) {
      throw new Error('OAuth authorization request is missing.');
    }

    const response = await fetch('/oauth/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        apiId: Number(apiId),
        apiHash: apiHash.trim(),
        session,
      }),
    });
    const result = (await response.json()) as {
      redirectTo?: string;
      error_description?: string;
    };

    if (!response.ok || !result.redirectTo) {
      throw new Error(result.error_description ?? 'Unable to complete OAuth authorization.');
    }

    setPassword('');
    await destroyClient();
    window.location.replace(result.redirectTo);
  }

  function requireClient(): TelegramClient {
    if (!clientRef.current) {
      throw new Error('Telegram connection was lost. Start again.');
    }

    return clientRef.current;
  }

  function abortConnection() {
    const reason = new DOMException('Telegram connection cancelled.', 'AbortError');

    abortControllerRef.current?.abort(reason);
    abortControllerRef.current = null;
    passwordRequestRef.current?.reject(reason);
    passwordRequestRef.current = null;
  }

  async function destroyClient() {
    abortConnection();
    const client = clientRef.current;

    clientRef.current = null;
    await client?.destroy();
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <ConnectHeader />
        <section className={styles.card}>
          <h1 className={styles.title}>Connect your Telegram</h1>
          <p className={styles.subtitle}>Sign in to finish connecting Telegram MCP to your AI workspace.</p>

          {step === 'credentials' && authorizationRequest.value && (
            <form className={styles.form} onSubmit={submitCredentials}>
              <p className={styles.formIntro}>
                For security, use your own Telegram app credentials from{' '}
                <a href="https://my.telegram.org/apps" rel="noreferrer" target="_blank">
                  my.telegram.org/apps
                </a>
                . This helps stop attackers from abusing shared credentials and affecting other users.
              </p>

              <label className={styles.field}>
                <span className={styles.label}>api_id</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  name="apiId"
                  placeholder="20420042"
                  required
                  value={apiId}
                  onChange={(event) => setApiId(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>api_hash</span>
                <input
                  className={styles.input}
                  autoComplete="off"
                  name="apiHash"
                  placeholder="8f4c2a91d7e64b0fa5c8139e2d476b20"
                  required
                  value={apiHash}
                  onChange={(event) => setApiHash(event.target.value)}
                />
              </label>

              <button className={styles.button} disabled={loading || !apiId.trim() || !apiHash.trim()} type="submit">
                {loading && <span className={styles.spinner} />}
                {loading ? 'Connecting…' : 'Continue with QR code'}
              </button>
            </form>
          )}

          {step === 'qr' && (
            <div className={styles.qrStep}>
              <ol className={styles.qrInstructions}>
                <li>Open Telegram on your phone</li>
                <li>Go to Settings → Devices → Add Device</li>
                <li>Scan this QR code to confirm login</li>
              </ol>

              <div className={styles.qrBlock}>
                <div className={styles.qrFrame}>
                  {qrUrl ? <QrCode value={qrUrl} /> : <span className={styles.qrLoading}>Creating QR code…</span>}
                </div>

                <p className={styles.qrStatus}>
                  {qrScanned
                    ? 'QR code scanned. Confirm the login in Telegram.'
                    : `QR code expires in ${formatCountdown(qrExpiresAt, now)}`}
                </p>
              </div>
            </div>
          )}

          {step === 'password' && (
            <form className={styles.form} onSubmit={submitPassword}>
              <p className={styles.formIntro}>
                QR code confirmed. This account has Telegram two-step verification enabled.
              </p>
              <label className={styles.field}>
                <span className={styles.label}>Telegram password</span>
                <input
                  className={styles.input}
                  autoComplete="current-password"
                  autoFocus
                  name="password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button className={styles.button} disabled={loading} type="submit">
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </form>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </section>

        <p className={styles.footer}>Credentials are encrypted and never stored on our server</p>
      </div>
    </main>
  );
}

function parseAuthorizationRequest(): ParsedAuthorizationRequest {
  const params = new URLSearchParams(window.location.search);
  const required = {
    clientId: params.get('client_id'),
    redirectUri: params.get('redirect_uri'),
    responseType: params.get('response_type'),
    codeChallenge: params.get('code_challenge'),
    codeChallengeMethod: params.get('code_challenge_method'),
    resource: params.get('resource'),
  };

  if (Object.values(required).some((value) => !value)) {
    return {
      value: null,
      error: null,
    };
  }

  return {
    value: {
      clientId: required.clientId!,
      redirectUri: required.redirectUri!,
      responseType: required.responseType!,
      codeChallenge: required.codeChallenge!,
      codeChallengeMethod: required.codeChallengeMethod!,
      resource: required.resource!,
      scope: params.get('scope') ?? undefined,
      state: params.get('state') ?? undefined,
    },
    error: null,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function formatCountdown(expiresAt: Date | null, now: number): string {
  const seconds = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000)) : 0;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function getErrorMessage(error: unknown): string {
  if (tl.RpcError.is(error)) {
    const messages: Partial<Record<string, string>> = {
      API_ID_INVALID: 'Telegram rejected this API ID or API hash.',
      PASSWORD_HASH_INVALID: 'The two-step verification password is invalid.',
    };

    return messages[error.text] ?? `Telegram returned ${error.text}.`;
  }

  return error instanceof Error ? error.message : 'Telegram authorization failed.';
}
