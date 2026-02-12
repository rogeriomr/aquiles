/**
 * Single analysis run - execute once and exit
 * Usage: npx ts-node scripts/run.ts [--mode=auto|alert]
 */
import { runAgent } from '../src/index';
import { logger } from '../src/utils/logger';

process.on('unhandledRejection', (err) => { logger.error(`Unhandled rejection: ${err}`); process.exit(1); });

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const rawMode = modeArg ? modeArg.split('=')[1] : undefined;
  const mode = rawMode === 'auto' || rawMode === 'alert' ? rawMode : 'alert';
  if (modeArg && rawMode !== 'auto' && rawMode !== 'alert') {
    logger.warn(`Invalid mode "${rawMode}". Using "alert".`);
  }

  logger.info(`Running single analysis cycle (mode: ${mode})...`);
  await runAgent({ mode });
}

main().catch(err => {
  logger.error(`Run failed: ${err.message}`);
  process.exit(1);
});
