export function formatUSD(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatBTC(value: number): string {
  return 'BTC $' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPercent(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%';
}

export function formatRatio(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatSOL(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4) + ' SOL';
}

export function formatUSDC(amount: number): string {
  return (amount / 1_000_000).toFixed(2) + ' USDC';
}

export function tierEmoji(tier: string): string {
  switch (tier) {
    case 'EXTREME': return '[!!!]';
    case 'STRONG':  return '[!! ]';
    case 'WATCH':   return '[!  ]';
    case 'NORMAL':  return '[   ]';
    default:        return '[   ]';
  }
}

export function tierBar(tier: string): string {
  switch (tier) {
    case 'EXTREME': return '████';
    case 'STRONG':  return '███░';
    case 'WATCH':   return '██░░';
    case 'NORMAL':  return '█░░░';
    default:        return '░░░░';
  }
}

export function padRight(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

export function padLeft(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : ' '.repeat(len - str.length) + str;
}
