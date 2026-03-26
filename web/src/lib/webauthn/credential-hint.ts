/** Short, non-sensitive disambiguator for UI lists (credentialId is base64url). */
export function formatCredentialHint(credentialId: string): string {
  if (credentialId.length <= 12) return credentialId;
  return `${credentialId.slice(0, 6)}…${credentialId.slice(-4)}`;
}
