import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// המפתח נקרא פעם אחת בעליית השרת. האורך (32 בתים) כבר נבדק ב-config/env.ts
const key = Buffer.from(env.ENCRYPTION_KEY, 'base64');

export interface EncryptedPayload {
  encryptedContent: string;
  nonce: string;
}

/**
 * מצפין טקסט גלוי ב-AES-256-GCM עם nonce חדש בכל קריאה.
 * תג האימות (16 בתים) משורשר לסוף ה-ciphertext לפני הקידוד ל-Base64.
 */
export function encryptText(plain: string): EncryptedPayload {
  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: Buffer.concat([ciphertext, authTag]).toString('base64'),
    nonce: nonce.toString('base64'),
  };
}

/**
 * מפענח את מה ש-encryptText החזיר. 16 הבתים האחרונים הם תג האימות.
 * תג שאינו תואם (מפתח שגוי או נתונים שהשתנו) זורק שגיאה, ולעולם אינו מחזיר תוכן חלקי.
 */
export function decryptText(encryptedContent: string, nonce: string): string {
  const data = Buffer.from(encryptedContent, 'base64');
  const nonceBytes = Buffer.from(nonce, 'base64');
  if (data.length < AUTH_TAG_LENGTH || nonceBytes.length !== NONCE_LENGTH) {
    throw new Error('Invalid encrypted payload');
  }

  const ciphertext = data.subarray(0, data.length - AUTH_TAG_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, nonceBytes, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
