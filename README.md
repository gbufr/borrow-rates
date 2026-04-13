# Onchain Loan Scanner

A robust, multi-protocol loan scanner for Ethereum Mainnet. Discovers and tracks active loan positions across Morpho Blue, Aave V3, Liquity (V1 & V2), and Maker MCD.

## Features

- **Multi-Protocol Discovery**: Hybrid approach using GraphQL (Morpho) and On-Chain iteration (Liquity, Aave, Maker).
- **Risk Dashboard**: Real-time Health Factor calculations using Chainlink price feeds.
- **Incremental Sync**: Efficiently stays up-to-date by tracking block cursors.
- **Swappable Persistence**: Supports both SQLite (local) and Postgres (production).

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   SQLITE_DB_PATH=data/loan_scanner.db
   ```

3. **Initialize Database**:
   The scanner automatically handles table creation on the first run.

## Usage


### 3. Incremental Sync
Stay updated with new blocks.
```bash
npx tsx src/index.ts --sync
```

## Architecture

- **`src/protocols/`**: Individual scanner logic for each protocol.
- **`src/db/`**: Database adapters (SQLite, Postgres).
- **`src/utils/`**: Shared utilities for RPC, Oracles (Risk Service), and Subgraphs.
- **`src/query.ts`**: The primary interface for data analysis.
- **[PROTOCOLS.md](file:///Users/sg/Documents/workspace/svylabs/liquidax-app/PROTOCOLS.md)**: Detailed data sources and risk methodology.

## Disclaimer

This is a demonstration tool. Ensure you have a professional-grade RPC provider for large-scale historical scanning.
