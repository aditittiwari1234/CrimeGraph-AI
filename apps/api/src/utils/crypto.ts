import crypto from 'crypto';

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateEvidenceHash(evidenceData: Record<string, unknown>): string {
  const normalized = JSON.stringify(evidenceData, Object.keys(evidenceData).sort());
  return hashData(normalized);
}

export function generateBlockHash(
  evidenceId: string,
  dataHash: string,
  previousHash: string,
  timestamp: string
): string {
  const blockString = `${evidenceId}:${dataHash}:${previousHash}:${timestamp}`;
  return hashData(blockString);
}

export function verifyEvidenceIntegrity(
  currentData: Record<string, unknown>,
  storedHash: string
): { valid: boolean; reason: string } {
  const computedHash = generateEvidenceHash(currentData);
  if (computedHash === storedHash) {
    return { valid: true, reason: 'Evidence integrity verified — hash matches stored record.' };
  }
  return {
    valid: false,
    reason: 'Evidence integrity FAILED — computed hash does not match stored hash. Data may have been tampered with.',
  };
}

export function generateAuditHash(
  userId: string,
  action: string,
  timestamp: string,
  previousHash: string
): string {
  const data = `${userId}:${action}:${timestamp}:${previousHash}`;
  return hashData(data);
}
