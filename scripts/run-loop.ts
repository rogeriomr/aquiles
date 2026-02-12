/**
 * Continuous monitoring - re-run analysis at configured intervals
 * Usage: npx ts-node scripts/run-loop.ts [--mode=auto|alert]
 */
import { runAgent } from '../src/index';
import { loadConfig } from '../src/config';
import { logger } from '../src/utils/logger';

process.on('unhandledRejection', (err) => { logger.error(`Unhandled rejection: ${err}`); process.exit(1); });

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const rawMode = modeArg ? modeArg.split('=')[1] : undefined;
  const mode = rawMode === 'auto' || rawMode === 'alert' ? rawMode : undefined;
  if (modeArg && rawMode !== 'auto' && rawMode !== 'alert') {
    logger.warn(`Invalid mode "${rawMode}". Using config default.`);
  }

  const config = loadConfig();
  const intervalMs = config.loopIntervalMinutes * 60 * 1000;

  logger.info(`Starting continuous monitoring (interval: ${config.loopIntervalMinutes} min, mode: ${mode || config.mode})`);
  logger.info('Press Ctrl+C to stop');
  logger.info('');

  let shouldStop = false;
  process.on('SIGINT', () => { logger.info('Received SIGINT, finishing current cycle...'); shouldStop = true; });
  process.on('SIGTERM', () => { logger.info('Received SIGTERM, finishing current cycle...'); shouldStop = true; });

  // Sequential loop to prevent concurrent cycles
  async function loop() {
    while (!shouldStop) {
      try {
        await runAgent(mode ? { mode } : undefined);
      } catch (err: any) {
        logger.error(`Cycle failed: ${err.message}`);
      }
      logger.info(`Next cycle in ${config.loopIntervalMinutes} minutes...`);
      await new Promise(r => setTimeout(r, intervalMs));
    }
    logger.info('Loop stopped gracefully.');
  }

  await loop();
}

main().catch(err => {
  logger.error(`Loop failed: ${err.message}`);
  process.exit(1);
});
