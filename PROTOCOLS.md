# Protocol Methodology & Data Sources

This document describes how Liquidax retrieves, calculates, and stores risk data for each supported protocol.

## 1. Loan Listing Methodology
How the scanner discovers and retrieves the list of active user positions:

| Protocol | Discovery Method | API / RPC Call |
| :--- | :--- | :--- |
| **Morpho Blue** | Subgraph Indexing | **GraphQL Query**: `marketPositions` (sorted by `borrowAssets` Desc) |
| **Aave V3** | Event Monitoring | **RPC**: `getLogs` for `Supply` and `Borrow` events on the `Pool` contract |
| **Maker MCD** | Registry Indexing | **RPC**: `getLogs` for `NewCdp` on `CdpManager` and `Vat` state |
| **Liquity V1** | List Iteration | **RPC**: `SortedTroves.getFirst()` then `getNext()` (collateral ratio order) |
| **Liquity V2** | Registry Scan | **RPC**: `CollateralRegistry.getTroveManager(index)` then `SortedTroves` |

---

## 2. Metric Calculations
How protocol-wide statistics are computed in the dashboard:

### Total Value Locked (TVL)
For each protocol, TVL is the sum of all collateral deposits in USD:
- **Formula**: `Sum(Collateral Amount / 10^Decimals * Current Price)`
- **Morpho**: Sum of both `supplyAssets` (earning interest) and `collateral` (for borrowing).
- **Aave**: Aggregated from `totalCollateralBase` in ETH units, converted via ETH price.
- **Liquity**: Sum of `Trove.coll` (ETH) across all active troves.

### Total Borrowed
Total debt exposure in USD:
- **Formula**: `Sum(Debt Amount / 10^Decimals * Debt Asset Price)`
- **Maker**: Sum of `Vault.art` (normalized debt) * `Vat.rate` (accumulation factor).
- **Sky**: Tracks the supply of the **USDS** stablecoin issued against collateral.

---

## 3. Interest Rates
How APY/Interest rates are derived for each protocol:

| Protocol | APY Source (Current) | Production Source |
| :--- | :--- | :--- |
| **Morpho Blue** | **Live** | Market-specific IRM (Interest Rate Model) contract |
| **Aave V3** | **Live** | `Pool.getReserveData(asset).currentVariableBorrowRate` |
| **Liquity V2** | **Live** | Per-branch `TroveManager` interest rate calculation |
| **Maker / Sky** | **Live** | `Vat.ilks(ilk).duty` (Stability Fee) |

> [!NOTE]
> Interest rates are now retrieved dynamically from the protocol's respective contracts and oracles.

---

## 4. Database Schema
Active positions are stored in the `positions` table with the following fields:

### Table: `positions`
| Field | Type | Description |
| :--- | :--- | :--- |
| **id** | TEXT (PK) | Unique ID (e.g., `{protocol}_{user}_{market}`) |
| **protocol** | TEXT | Protocol Name (MorphoBlue, AaveV3, etc.) |
| **userAddress** | TEXT | Ethereum address of the borrower |
| **collateralAmount** | TEXT | Raw bigint value from the contract |
| **collateralSymbol** | TEXT | Asset symbol (WETH, WBTC, etc.) |
| **debtAmount** | TEXT | Raw bigint value from the contract |
| **healthFactor** | REAL | Cached health factor (recalculated on-the-fly in API) |
| **lastUpdateTimestamp** | INTEGER | Unix timestamp of the last sync |

### Table: `block_cursors`
Tracks the sync progress per protocol to ensure incremental updates:
- **protocol**: TEXT (PK)
- **last_block**: INTEGER

---

## 4. Risk Service & Price Feeds
Liquidax uses **Chainlink Oracles** for all USD valuations.
- **ETH/USD**: [0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419](https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419)
- **BTC/USD**: [0xf47022cb55c8364c7f154024c736be21bb21a8d8](https://etherscan.io/address/0xf47022cb55c8364c7f154024c736be21bb21a8d8)

---

## Risk Service & Price Feeds
All valuations are calculated in real-time by the `RiskService` using **Chainlink Price Oracles**.
- **ETH/USD**: [0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419](https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419)
- **BTC/USD**: [0xf47022cb55c8364c7f154024c736be21bb21a8d8](https://etherscan.io/address/0xf47022cb55c8364c7f154024c736be21bb21a8d8)
