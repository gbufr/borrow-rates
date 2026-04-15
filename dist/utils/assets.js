export function getAssetCategory(symbol) {
    const s = symbol.toUpperCase();
    if (s.includes('USD') || s === 'DAI' || s === 'USDS' || s === 'BOLD' || s === 'LUSD' || s === 'GHO') {
        return 'USD';
    }
    if (s.includes('BTC')) {
        return 'BTC';
    }
    if (s.includes('ETH')) {
        return 'ETH';
    }
    if (s.includes('EUR')) {
        return 'EUR';
    }
    if (s.includes('JPY')) {
        return 'JPY';
    }
    if (s.includes('GOLD') || s.includes('KGLD')) {
        return 'GOLD';
    }
    if (s === 'SOL' || s.includes('SOL')) {
        return 'SOL';
    }
    if (s === 'PRIME' || s === 'ONYC' || s === 'SYRUPUSDC' || s === 'USCC' || s === 'PST' || s === 'EUSX') {
        return 'RWA';
    }
    return 'OTHER';
}
export function getAssetPath(symbol) {
    const s = symbol.toUpperCase();
    const paths = {
        'WSTETH': 'ETH ➔ stETH ➔ wstETH',
        'WEETH': 'ETH ➔ eETH ➔ weETH',
        'CBBTC': 'BTC ➔ cbBTC',
        'WBTC': 'BTC ➔ WBTC',
        'LBTC': 'BTC ➔ Lombard ➔ LBTC',
        'CBTC': 'BTC ➔ cBTC',
        'WCZBTC': 'BTC ➔ ctBTC',
        'CTBTC': 'BTC ➔ ctBTC',
        'WCETC': 'BTC ➔ ctBTC',
        'WCBTC': 'BTC ➔ cBTC',
        'SUSDE': 'USDe ➔ sUSDe',
        'STUSDS': 'USDS ➔ stUSDS',
        'WETH': 'ETH ➔ WETH',
        'MKGLD': 'GOLD ➔ KGLD ➔ mKGLD',
        'PRIME': 'Real Estate ➔ Figure ➔ PRIME',
        'ONYC': 'Insurance ➔ OnRe ➔ ONyc',
        'SYRUPUSDC': 'Institutional Credit ➔ Maple ➔ syrupUSDC',
        'USCC': 'T-Bills/Credit ➔ Superstate ➔ USCC',
        'PST': 'Receivables ➔ Huma ➔ PST',
        'EUSX': 'T-Bills ➔ Mountain ➔ eUSX',
    };
    return paths[s] || null;
}
