import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class CryptoUtils {
  private static key: Buffer;

  static initialize(encryptionKey: string) {
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!this.key) {
      throw new Error('Crypto not initialized. Call CryptoUtils.initialize() first.');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, this.key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    if (!this.key) {
      throw new Error('Crypto not initialized. Call CryptoUtils.initialize() first.');
    }

    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, this.key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static generateSlug(): string {
    return crypto.randomBytes(4).toString('hex');
  }
}