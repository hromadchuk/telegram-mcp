export const isDev = process.env.npm_lifecycle_event === 'dev';

export function getNestLoggerConfig(): Array<'log' | 'error' | 'warn' | 'debug' | 'verbose'> {
  return ['error', 'warn'];
}
