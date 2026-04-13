import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'liquidax-db-backups';
const dbPath = process.env.SQLITE_DB_PATH || 'data/loan_scanner.db';
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
        }
        catch (e) {
            console.error(`[GCS] Backup failed:`, e);
        }
    }
    static async restore() {
        console.log(`[GCS] Attempting to restore database from gs://${bucketName}/...`);
        try {
            const destDir = path.dirname(dbPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            await storage.bucket(bucketName).file('loan_scanner.db').download({
                destination: dbPath,
            });
            console.log(`[GCS] Restore successful.`);
            return true;
        }
        catch (e) {
            if (e.code === 404) {
                console.warn(`[GCS] No existing backup found in GCS. Starting with fresh DB.`);
            }
            else {
                console.error(`[GCS] Restore failed:`, e);
            }
            return false;
        }
    }
}
