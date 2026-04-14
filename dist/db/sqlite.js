import path from 'path';
import fs from 'fs';
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
export class SQLiteAdapter {
    db;
    constructor(dbPath) {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            }
            catch (e) {
                console.warn(`Could not create directory ${dir}:`, e);
            }
        }
        const dialect = new SqliteDialect({
            database: new Database(dbPath),
        });
        this.db = new Kysely({
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
        }
        catch (e) { }
        try {
            await this.db.schema
                .alterTable('rates')
                .addColumn('liquidationPenalty', 'float4')
                .execute();
        }
        catch (e) { }
        try {
            await this.db.schema
                .alterTable('rates')
                .addColumn('rateType', 'text')
                .execute();
        }
        catch (e) { }
    }
    async upsertPosition(position) {
        await this.db
            .insertInto('positions')
            .values(position)
            .onConflict((oc) => oc.column('id').doUpdateSet(position))
            .execute();
    }
    async getPositionsByProtocol(protocol) {
        return await this.db.selectFrom('positions').selectAll().where('protocol', '=', protocol).execute();
    }
    async getAllPositions() {
        return await this.db.selectFrom('positions').selectAll().execute();
    }
    async updateBlockCursor(protocol, blockNumber) {
        await this.db
            .insertInto('block_cursors')
            .values({ protocol, lastSyncedBlock: blockNumber })
            .onConflict((oc) => oc.column('protocol').doUpdateSet({ lastSyncedBlock: blockNumber }))
            .execute();
    }
    async getBlockCursor(protocol) {
        const res = await this.db
            .selectFrom('block_cursors')
            .select('lastSyncedBlock')
            .where('protocol', '=', protocol)
            .executeTakeFirst();
        return res?.lastSyncedBlock ?? 0;
    }
    async upsertPrice(price) {
        await this.db
            .insertInto('prices')
            .values(price)
            .onConflict((oc) => oc.column('symbol').doUpdateSet(price))
            .execute();
    }
    async getAllPrices() {
        return await this.db.selectFrom('prices').selectAll().execute();
    }
    async upsertRate(rate) {
        const values = {
            ...rate,
            isRWA: rate.isRWA ? 1 : 0
        };
        await this.db
            .insertInto('rates')
            .values(values)
            .onConflict((oc) => oc.columns(['protocol', 'assetPair']).doUpdateSet(values))
            .execute();
    }
    async getAllRates() {
        return await this.db.selectFrom('rates').selectAll().execute();
    }
    async getOldestRates(limit) {
        return await this.db
            .selectFrom('rates')
            .selectAll()
            .orderBy('lastUpdateTimestamp', 'asc')
            .limit(limit)
            .execute();
    }
    async deleteRatesForProtocol(protocol) {
        await this.db.deleteFrom('rates').where('protocol', '=', protocol).execute();
    }
    async close() {
        await this.db.destroy();
    }
}
