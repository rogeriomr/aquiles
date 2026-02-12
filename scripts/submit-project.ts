/**
 * Submit project to Colosseum hackathon
 * Usage: npx ts-node scripts/submit-project.ts
 */
import { loadConfig } from '../src/config';
import { createProject, submitProject, getProject, buildProjectPayload } from '../src/integrations/colosseum';
import { logger } from '../src/utils/logger';

async function main() {
  const config = loadConfig();

  if (!config.colosseumApiKey) {
    logger.error('COLOSSEUM_API_KEY not set in .env');
    process.exit(1);
  }

  const apiKey = config.colosseumApiKey;

  // Step 1: Check if project already exists
  try {
    const existing = await getProject(apiKey);
    logger.info('Project already exists:');
    console.log(JSON.stringify(existing, null, 2));
    logger.info('');
  } catch {
    // Project doesn't exist yet, create it
    logger.info('No existing project found. Creating...');
    const payload = buildProjectPayload();
    console.log('');
    console.log('Project payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    try {
      const result = await createProject(apiKey, payload);
      logger.success('Project created!');
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      logger.error(`Failed to create project: ${err.message}`);
      process.exit(1);
    }
  }

  // Step 2: Submit for review
  try {
    const submitResult = await submitProject(apiKey);
    logger.success('Project submitted to Colosseum hackathon!');
    console.log(JSON.stringify(submitResult, null, 2));
  } catch (err: any) {
    logger.error(`Failed to submit: ${err.message}`);
    logger.info('You may need to submit manually via the Colosseum dashboard.');
  }
}

main().catch(err => {
  logger.error(`Submit failed: ${err.message}`);
  process.exit(1);
});
