/**
 * Single analysis run - execute once and exit
 * Usage: npx ts-node scripts/run.ts [--mode=auto|alert]
 */
import { runAgent } from '../src/index';
import { logger } from '../src/utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] as 'auto' | 'alert' : 'alert';

  logger.info(`Running single analysis cycle (mode: ${mode})...`);
  await runAgent({ mode });
}

main().catch(err => {
  logger.error(`Run failed: ${err.message}`);
  process.exit(1);
});
