import dotenv from 'dotenv';
import { ILoanRepository } from './interface';
import { SQLiteAdapter } from './sqlite';
import { PostgresAdapter } from './postgres';

dotenv.config();

export async function getDatabaseAdapter(): Promise<ILoanRepository> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    const adapter = new PostgresAdapter(databaseUrl);
    await adapter.init();
    return adapter;
  } else {
    // Default to SQLite
    const adapter = new SQLiteAdapter(process.env.SQLITE_DB_PATH || 'data/loan_scanner.db');
    await adapter.init();
    return adapter;
  }
}

export * from './interface';
