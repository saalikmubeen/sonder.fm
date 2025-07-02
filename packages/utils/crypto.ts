// import crypto from 'crypto';

// const ALGORITHM = 'aes-256-gcm';

// export class CryptoUtils {
//   private static key: Buffer;

//   static initialize(encryptionKey: string) {
//     this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
//   }

//   static encrypt(text: string): string {
//     if (!this.key) {
//       throw new Error('Crypto not initialized. Call CryptoUtils.initialize() first.');
//     }

//     const iv = crypto.randomBytes(16);
//     const cipher = crypto.createCipher(ALGORITHM, this.key);

//     let encrypted = cipher.update(text, 'utf8', 'hex');
//     encrypted += cipher.final('hex');

//     const authTag = cipher.getAuthTag();

//     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
//   }

//   static decrypt(encryptedText: string): string {
//     if (!this.key) {
//       throw new Error('Crypto not initialized. Call CryptoUtils.initialize() first.');
//     }

//     const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

//     const iv = Buffer.from(ivHex, 'hex');
//     const authTag = Buffer.from(authTagHex, 'hex');

//     const decipher = crypto.createDecipher(ALGORITHM, this.key);
//     decipher.setAuthTag(authTag);

//     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');

//     return decrypted;
//   }

//   static generateSlug(): string {
//     return crypto.randomBytes(4).toString('hex');
//   }
// }

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits is recommended for GCM

export class CryptoUtils {
  private static key: Buffer;

  static initialize(encryptionKey: string) {
    if (!encryptionKey) {
      throw new Error(
        'Encryption key is required for initialization.'
      );
    }

    // Derive key from password using scrypt
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!this.key) {
      throw new Error(
        'Crypto not initialized. Call CryptoUtils.initialize() first.'
      );
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:cipherText (all in base64 for compact, safe transmission)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  static decrypt(encryptedText: string): string {
    if (!this.key) {
      throw new Error(
        'Crypto not initialized. Call CryptoUtils.initialize() first.'
      );
    }

    const [ivBase64, authTagBase64, encryptedBase64] =
      encryptedText.split(':');
    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      throw new Error('Invalid encrypted data format.');
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  static generateSlug(): string {
    return crypto.randomBytes(4).toString('hex');
  }
}
