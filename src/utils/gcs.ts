import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'liquidax-db-backups';
const defaultDbPath = process.env.NODE_ENV === 'production' ? '/tmp/loan_scanner.db' : 'data/loan_scanner.db';
const dbPath = process.env.SQLITE_DB_PATH || defaultDbPath;

export class GCSStorage {
  static async backup() {
    if (!fs.existsSync(dbPath)) {
      console.warn(`[GCS] Database file not found at ${dbPath}, skipping backup.`);
      return;
    }
    
    console.log(`[GCS] Uploading ${dbPath} to gs://${bucketName}/...`);
    try {
      await storage.bucket(bucketName).upload(dbPath, {
        destination: 'loan_scanner.db',
      });
      console.log(`[GCS] Backup successful.`);
    } catch (e) {
      console.error(`[GCS] Backup failed:`, e);
    }
  }

  static async getUpdatedTime(): Promise<number | null> {
    try {
      const [metadata] = await storage.bucket(bucketName).file('loan_scanner.db').getMetadata();
      return metadata.updated ? new Date(metadata.updated).getTime() : null;
    } catch (e: any) {
      if (e.code !== 404) {
        console.error(`[GCS] Failed to get metadata:`, e);
      }
      return null;
    }
  }

  static async restore() {
    console.log(`[GCS] Attempting to restore database from gs://${bucketName}/...`);
    try {
      const destDir = path.dirname(dbPath);
      if (!fs.existsSync(destDir)) {
        try {
          fs.mkdirSync(destDir, { recursive: true });
        } catch (e) {
          console.warn(`[GCS] Could not create directory ${destDir}:`, e);
        }
      }

      await storage.bucket(bucketName).file('loan_scanner.db').download({
        destination: dbPath,
      });
      console.log(`[GCS] Restore successful.`);
      return true;
    } catch (e: any) {
      if (e.code === 404) {
        console.warn(`[GCS] No existing backup found in GCS. Checking for seed database...`);
        // Fallback: If bundled database exists, use it as a seed
        const seedPath = 'data/loan_scanner.db';
        if (fs.existsSync(seedPath) && !fs.existsSync(dbPath)) {
          console.log(`[GCS] Seeding from bundled database: ${seedPath} -> ${dbPath}`);
          try {
            fs.copyFileSync(seedPath, dbPath);
            return true;
          } catch (err) {
            console.error(`[GCS] Failed to seed from bundle:`, err);
          }
        }
      } else {
        console.error(`[GCS] Restore failed:`, e);
      }
      return false;
    }
  }
}
