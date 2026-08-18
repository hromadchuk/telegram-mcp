const blockedMethods = new Map<string, string>([
  ['account.changePhone', 'Changing the account phone number is not allowed.'],
  ['account.deleteAccount', 'Deleting the Telegram account is not allowed.'],
  ['account.resetAuthorization', 'Terminating Telegram sessions is not allowed.'],
  ['account.resetWebAuthorization', 'Terminating web sessions is not allowed.'],
  ['account.resetWebAuthorizations', 'Terminating web sessions is not allowed.'],
  ['account.updatePasswordSettings', 'Changing the account password is not allowed.'],
]);

export function getBlockedMethodReason(method: string): string | null {
  if (method.startsWith('auth.')) {
    return 'Authentication methods are managed by the connection flow and cannot be called directly.';
  }

  return blockedMethods.get(method) ?? null;
}
