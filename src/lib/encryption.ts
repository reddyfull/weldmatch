// lib/encryption.ts
import CryptoJS from 'crypto-js';

// Encryption version prefix for future algorithm upgrades
const ENCRYPTION_VERSION = 'enc_v1';
const SEPARATOR = ':';

// Master key should be stored in environment variable
// In production, use a proper key management service (AWS KMS, HashiCorp Vault)
const getMasterKey = (): string => {
  const key = import.meta.env.VITE_ENCRYPTION_MASTER_KEY;
  if (!key) {
    console.warn('Encryption master key not configured - using fallback for development');
    // Fallback for development only - NEVER use in production
    return 'dev-fallback-key-do-not-use-in-production-12345';
  }
  return key;
};

// Derive a unique key per user for additional security
const deriveUserKey = (userId: string, masterKey: string): string => {
  return CryptoJS.PBKDF2(masterKey, userId, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
};

/**
 * Encrypt a value for storage
 * Returns: "enc_v1:iv:ciphertext" format
 */
export const encryptField = (
  value: string | number | null | undefined,
  userId: string
): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  try {
    const masterKey = getMasterKey();
    const userKey = deriveUserKey(userId, masterKey);
    
    // Generate random IV for each encryption
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt using AES-256
    const encrypted = CryptoJS.AES.encrypt(
      String(value),
      CryptoJS.enc.Hex.parse(userKey),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // Format: version:iv:ciphertext
    return `${ENCRYPTION_VERSION}${SEPARATOR}${iv.toString(CryptoJS.enc.Base64)}${SEPARATOR}${encrypted.toString()}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
};

/**
 * Decrypt a value for display
 */
export const decryptField = (
  encryptedValue: string | null | undefined,
  userId: string
): string | null => {
  if (!encryptedValue || !encryptedValue.startsWith(ENCRYPTION_VERSION)) {
    // Return as-is if not encrypted (legacy data or non-sensitive)
    return encryptedValue || null;
  }

  try {
    const masterKey = getMasterKey();
    const userKey = deriveUserKey(userId, masterKey);
    
    // Parse the encrypted format
    const parts = encryptedValue.split(SEPARATOR);
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const [, ivBase64, ciphertext] = parts;
    const iv = CryptoJS.enc.Base64.parse(ivBase64);

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      ciphertext,
      CryptoJS.enc.Hex.parse(userKey),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed for field');
    return '[DECRYPTION_ERROR]';
  }
};

/**
 * Check if a value is encrypted
 */
export const isEncrypted = (value: string | null | undefined): boolean => {
  return !!value && value.startsWith(ENCRYPTION_VERSION);
};

/**
 * Encrypt multiple fields in an object
 */
export const encryptFields = <T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[],
  userId: string
): T => {
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] !== null && encrypted[field] !== undefined) {
      (encrypted as any)[field] = encryptField(encrypted[field], userId);
    }
  }
  
  return encrypted;
};

/**
 * Decrypt multiple fields in an object
 */
export const decryptFields = <T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[],
  userId: string
): T => {
  const decrypted = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && isEncrypted(decrypted[field])) {
      (decrypted as any)[field] = decryptField(decrypted[field], userId);
    }
  }
  
  return decrypted;
};

/**
 * Mask a decrypted value for partial display
 * e.g., SSN: ***-**-6789
 */
export const maskField = (
  value: string | null,
  type: 'ssn' | 'phone' | 'account' | 'email' | 'address' | 'date' | 'text'
): string => {
  if (!value) return '••••••••';

  switch (type) {
    case 'ssn':
      // Show last 4 digits: ***-**-1234
      return `***-**-${value.slice(-4)}`;
    
    case 'phone':
      // Show last 4 digits: (***) ***-1234
      return `(***) ***-${value.slice(-4)}`;
    
    case 'account':
      // Show last 4 digits: ****1234
      return `****${value.slice(-4)}`;
    
    case 'email':
      // Show first char and domain: j***@example.com
      const atIndex = value.indexOf('@');
      if (atIndex > 0) {
        const [local, domain] = value.split('@');
        return `${local[0]}***@${domain}`;
      }
      return '***@***.***';
    
    case 'address':
      // Show only city/state: ***, Houston, TX
      const parts = value.split(',');
      if (parts.length >= 2) {
        return `***,${parts.slice(-2).join(',')}`;
      }
      return '***';

    case 'date':
      // Show only year: **/**/1990
      const dateParts = value.split(/[-/]/);
      if (dateParts.length >= 1) {
        return `**/**/${dateParts[dateParts.length - 1]}`;
      }
      return '**/**/****';
    
    case 'text':
    default:
      return '••••••••';
  }
};

// Key rotation support
export const ENCRYPTION_VERSIONS = {
  v1: ENCRYPTION_VERSION,
};

// Sensitive patterns for console redaction in production
export const SENSITIVE_PATTERNS = [
  /\d{3}-\d{2}-\d{4}/, // SSN
  /\(\d{3}\)\s?\d{3}-\d{4}/, // Phone
  /\d{9,}/, // Account numbers
];

/**
 * Redact sensitive data from a string (for logging)
 */
export const redactSensitive = (text: string): string => {
  let redacted = text;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(new RegExp(pattern, 'g'), '[REDACTED]');
  });
  return redacted;
};
