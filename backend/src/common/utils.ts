export function getNestLoggerConfig(): Array<'log' | 'error' | 'warn' | 'debug' | 'verbose'> {
  return ['error', 'warn'];
}
