import dotenv from 'dotenv';
import { ILoanRepository } from './interface.js';
import { SQLiteAdapter } from './sqlite.js';
import { PostgresAdapter } from './postgres.js';

dotenv.config();

export async function getDatabaseAdapter(): Promise<ILoanRepository> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    const adapter = new PostgresAdapter(databaseUrl);
    await adapter.init();
    return adapter;
  } else {
    // Default to SQLite
    const defaultPath = process.env.NODE_ENV === 'production' ? '/tmp/loan_scanner.db' : 'data/loan_scanner.db';
    const adapter = new SQLiteAdapter(process.env.SQLITE_DB_PATH || defaultPath);
    await adapter.init();
    return adapter;
  }
}

export * from './interface.js';
