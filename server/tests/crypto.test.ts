import { describe, expect, it } from 'vitest';
import { decryptText, encryptText } from '../src/crypto';

describe('crypto: encryptText / decryptText', () => {
  it('הצפנה ואז פענוח מחזירים את הטקסט המקורי, כולל עברית וטקסט ארוך', () => {
    for (const plain of ['hello', 'מספר החשבון הוא 12-345-6789 🙂', 'א'.repeat(20_000)]) {
      const { encryptedContent, nonce } = encryptText(plain);
      expect(decryptText(encryptedContent, nonce)).toBe(plain);
    }
  });

  it('nonce בן 12 בתים ותג אימות בן 16 בתים משורשר לסוף', () => {
    const plain = 'abc';
    const { encryptedContent, nonce } = encryptText(plain);
    expect(Buffer.from(nonce, 'base64')).toHaveLength(12);
    expect(Buffer.from(encryptedContent, 'base64')).toHaveLength(Buffer.byteLength(plain) + 16);
  });

  it('ciphertext ששונה בבית אחד גורם לכשל פענוח ולא לתוכן שגוי', () => {
    const { encryptedContent, nonce } = encryptText('תוכן סודי');
    const bytes = Buffer.from(encryptedContent, 'base64');
    bytes[0] ^= 0x01;
    expect(() => decryptText(bytes.toString('base64'), nonce)).toThrow();
  });

  it('שתי הצפנות של אותו טקסט מחזירות ciphertext ו-nonce שונים', () => {
    const a = encryptText('אותו טקסט');
    const b = encryptText('אותו טקסט');
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.encryptedContent).not.toBe(b.encryptedContent);
  });

  it('ה-ciphertext אינו מכיל את הטקסט הגלוי', () => {
    const plain = 'secret-value-123';
    const { encryptedContent } = encryptText(plain);
    expect(encryptedContent).not.toContain(plain);
    expect(Buffer.from(encryptedContent, 'base64').toString('utf8')).not.toContain(plain);
  });
});
