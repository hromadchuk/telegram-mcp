import { useEffect, useState } from 'react';
import type { HealthResponse } from '@repo/shared';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Backend is unavailable');
      });
  }, []);

  return (
    <main>
      <h1>Telegram MCP</h1>
      <p>React frontend and NestJS backend.</p>
      <p className={error ? 'error' : undefined}>
          {error ?? (health ? `Backend: ${health.status}` : 'Checking backend…')}
      </p>
    </main>
  );
}
