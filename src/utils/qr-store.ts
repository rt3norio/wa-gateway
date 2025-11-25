/**
 * QR Code Store
 * Stores QR codes for sessions that are in the process of connecting
 */
class QRStore {
  private qrCodes: Map<string, { qr: string; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Store QR code for a session
   */
  storeQR(sessionName: string, qr: string): void {
    this.qrCodes.set(sessionName, {
      qr,
      timestamp: Date.now(),
    });
  }

  /**
   * Get QR code for a session
   * Returns null if not found or expired
   */
  getQR(sessionName: string): string | null {
    const stored = this.qrCodes.get(sessionName);
    if (!stored) {
      return null;
    }

    // Check if expired
    if (Date.now() - stored.timestamp > this.TTL) {
      this.qrCodes.delete(sessionName);
      return null;
    }

    return stored.qr;
  }

  /**
   * Remove QR code for a session (when connected)
   */
  removeQR(sessionName: string): void {
    this.qrCodes.delete(sessionName);
  }

  /**
   * Clear all expired QR codes
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [sessionName, stored] of this.qrCodes.entries()) {
      if (now - stored.timestamp > this.TTL) {
        this.qrCodes.delete(sessionName);
      }
    }
  }
}

export const qrStore = new QRStore();


