/**
 * Continuous monitoring - re-run analysis at configured intervals
 * Usage: npx ts-node scripts/run-loop.ts [--mode=auto|alert]
 */
import { runAgent } from '../src/index';
import { loadConfig } from '../src/config';
import { logger } from '../src/utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] as 'auto' | 'alert' : undefined;

  const config = loadConfig();
  const intervalMs = config.loopIntervalMinutes * 60 * 1000;

  logger.info(`Starting continuous monitoring (interval: ${config.loopIntervalMinutes} min, mode: ${mode || config.mode})`);
  logger.info('Press Ctrl+C to stop');
  logger.info('');

  // Sequential loop to prevent concurrent cycles
  async function loop() {
    while (true) {
      try {
        await runAgent(mode ? { mode } : undefined);
      } catch (err: any) {
        logger.error(`Cycle failed: ${err.message}`);
      }
      logger.info(`Next cycle in ${config.loopIntervalMinutes} minutes...`);
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  await loop();
}

main().catch(err => {
  logger.error(`Loop failed: ${err.message}`);
  process.exit(1);
});
