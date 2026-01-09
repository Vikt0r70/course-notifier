import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

class FirebaseService {
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize(): boolean {
    if (this.initialized) {
      return true;
    }

    try {
      // Look for service account file in multiple locations
      const possiblePaths = [
        path.join(__dirname, '../../../firebase-service-account.json'),
        path.join(process.cwd(), 'firebase-service-account.json'),
        '/app/firebase-service-account.json', // Docker path
      ];

      let serviceAccountPath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          serviceAccountPath = p;
          break;
        }
      }

      if (!serviceAccountPath) {
        console.warn('⚠️ Firebase service account file not found. FCM push notifications disabled.');
        console.warn('   Searched paths:', possiblePaths);
        return false;
      }

      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      return false;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get Firebase Admin instance
   */
  getAdmin(): typeof admin | null {
    if (!this.initialized) {
      return null;
    }
    return admin;
  }

  /**
   * Get Firebase Messaging instance
   */
  getMessaging(): admin.messaging.Messaging | null {
    if (!this.initialized) {
      return null;
    }
    return admin.messaging();
  }
}

export default new FirebaseService();
