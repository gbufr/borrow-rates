import path from 'path';
import fs from 'fs';
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { DatabaseSchema, ILoanRepository, LoanPosition, AssetPrice, MarketRate } from './interface.js';

export class SQLiteAdapter implements ILoanRepository {
  private db: Kysely<DatabaseSchema>;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.warn(`Could not create directory ${dir}:`, e);
      }
    }
    const dialect = new SqliteDialect({
      database: new Database(dbPath),
    });

    this.db = new Kysely<DatabaseSchema>({
      dialect,
    });
  }

  async init() {
    await this.db.schema
      .createTable('positions')
      .ifNotExists()
      .addColumn('id', 'text', (cb) => cb.primaryKey())
      .addColumn('protocol', 'text')
      .addColumn('userAddress', 'text')
      .addColumn('marketId', 'text')
      .addColumn('collateralAsset', 'text')
      .addColumn('collateralSymbol', 'text')
      .addColumn('collateralAmount', 'text')
      .addColumn('collateralDecimals', 'integer')
      .addColumn('debtAsset', 'text')
      .addColumn('debtSymbol', 'text')
      .addColumn('debtAmount', 'text')
      .addColumn('debtDecimals', 'integer')
      .addColumn('healthFactor', 'float4')
      .addColumn('ltv', 'float4')
      .addColumn('liquidationPrice', 'float4')
      .addColumn('lastUpdateBlock', 'integer')
      .addColumn('lastUpdateTimestamp', 'integer')
      .addColumn('chain', 'text')
      .execute();

    await this.db.schema
      .createTable('block_cursors')
      .ifNotExists()
      .addColumn('protocol', 'text', (cb) => cb.primaryKey())
      .addColumn('lastSyncedBlock', 'integer')
      .execute();

    await this.db.schema
      .createTable('prices')
      .ifNotExists()
      .addColumn('symbol', 'text', (cb) => cb.primaryKey())
      .addColumn('price', 'float8')
      .addColumn('lastUpdateTimestamp', 'integer')
      .execute();

    await this.db.schema
      .createTable('rates')
      .ifNotExists()
      .addColumn('protocol', 'text')
      .addColumn('assetPair', 'text')
      .addColumn('rate', 'float8')
      .addColumn('lastUpdateTimestamp', 'integer')
      .addColumn('chain', 'text')
      .addColumn('collateralSymbol', 'text')
      .addColumn('debtSymbol', 'text')
      .addColumn('isRWA', 'integer') // 0 or 1
      .addColumn('ltv', 'float4')
      .addColumn('collateralCategory', 'text')
      .addColumn('debtCategory', 'text')
      .addColumn('collateralPath', 'text')
      .addColumn('debtPath', 'text')
      .addColumn('liquidationThreshold', 'float4')
      .addColumn('liquidationPenalty', 'float4')
      .addPrimaryKeyConstraint('rates_pk', ['protocol', 'assetPair'])
      .execute();

    // Migration for existing tables: add new columns if missing
    try {
      await this.db.schema
        .alterTable('rates')
        .addColumn('liquidationThreshold', 'float4')
        .execute();
    } catch (e) {}

    try {
      await this.db.schema
        .alterTable('rates')
        .addColumn('liquidationPenalty', 'float4')
        .execute();
    } catch (e) {}

    try {
      await this.db.schema
        .alterTable('rates')
        .addColumn('rateType', 'text')
        .execute();
    } catch (e) {}
  }

  async upsertPosition(position: LoanPosition): Promise<void> {
    await this.db
      .insertInto('positions')
      .values(position)
      .onConflict((oc) => oc.column('id').doUpdateSet(position))
      .execute();
  }

  async getPositionsByProtocol(protocol: string): Promise<LoanPosition[]> {
    return await this.db.selectFrom('positions').selectAll().where('protocol', '=', protocol).execute();
  }

  async getAllPositions(): Promise<LoanPosition[]> {
    return await this.db.selectFrom('positions').selectAll().execute();
  }

  async updateBlockCursor(protocol: string, blockNumber: number): Promise<void> {
    await this.db
      .insertInto('block_cursors')
      .values({ protocol, lastSyncedBlock: blockNumber })
      .onConflict((oc) => oc.column('protocol').doUpdateSet({ lastSyncedBlock: blockNumber }))
      .execute();
  }

  async getBlockCursor(protocol: string): Promise<number> {
    const res = await this.db
      .selectFrom('block_cursors')
      .select('lastSyncedBlock')
      .where('protocol', '=', protocol)
      .executeTakeFirst();
    return res?.lastSyncedBlock ?? 0;
  }

  async upsertPrice(price: AssetPrice): Promise<void> {
    await this.db
      .insertInto('prices')
      .values(price)
      .onConflict((oc) => oc.column('symbol').doUpdateSet(price))
      .execute();
  }

  async getAllPrices(): Promise<AssetPrice[]> {
    return await this.db.selectFrom('prices').selectAll().execute();
  }

  async upsertRate(rate: MarketRate): Promise<void> {
    const values = {
      ...rate,
      isRWA: rate.isRWA ? 1 : 0
    };
    await this.db
      .insertInto('rates')
      .values(values as any)
      .onConflict((oc) => oc.columns(['protocol', 'assetPair']).doUpdateSet(values as any))
      .execute();
  }

  async getAllRates(): Promise<MarketRate[]> {
    return await this.db.selectFrom('rates').selectAll().execute();
  }

  async getOldestRates(limit: number): Promise<MarketRate[]> {
    return await this.db
      .selectFrom('rates')
      .selectAll()
      .orderBy('lastUpdateTimestamp', 'asc')
      .limit(limit)
      .execute();
  }

  async deleteRatesForProtocol(protocol: string): Promise<void> {
    await this.db.deleteFrom('rates').where('protocol', '=', protocol).execute();
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
