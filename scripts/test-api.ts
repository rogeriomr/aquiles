import * as dotenv from 'dotenv';
dotenv.config();

import { fetchIndicatorsFromApi } from '../src/perception/bitcoin-lab';

async function main() {
  console.log('Testing Bitcoin LAB API integration...');
  console.log(`Token: ${process.env.BITCOIN_LAB_API_TOKEN ? '***' + process.env.BITCOIN_LAB_API_TOKEN.slice(-6) : 'NOT SET'}`);

  const data = await fetchIndicatorsFromApi();
  console.log('\n=== FETCHED INDICATORS ===');
  console.log(JSON.stringify(data, null, 2));

  // Compare with file
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'data', 'indicators.json');
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('\n=== COMPARISON: API vs FILE ===');
  const fields = Object.keys(data).filter(k => k !== 'timestamp') as (keyof typeof data)[];
  for (const field of fields) {
    const apiVal = data[field];
    const fileVal = fileData[field];
    if (typeof apiVal === 'number' && typeof fileVal === 'number') {
      const diff = ((apiVal - fileVal) / fileVal * 100).toFixed(2);
      const mark = Math.abs(Number(diff)) > 5 ? ' ⚠️' : ' ✓';
      console.log(`  ${field}: API=${apiVal} | File=${fileVal} | Δ=${diff}%${mark}`);
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
