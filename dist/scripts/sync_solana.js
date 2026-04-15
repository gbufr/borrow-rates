import { getDatabaseAdapter } from '../db/index.js';
import { SolanaScanner } from '../protocols/solana.js';
async function syncSolanaOnly() {
    console.log('--- Starting Targeted Solana/Kamino Sync ---');
    const db = await getDatabaseAdapter();
    const scanner = new SolanaScanner(db);
    try {
        console.log(`Checking protocol: ${scanner.getName()}`);
        await scanner.syncAllRates(db);
        console.log('--- Sync Finished ---');
    }
    catch (e) {
        console.error('Sync failed:', e);
    }
    finally {
        await db.close();
    }
}
syncSolanaOnly().catch(console.error);
