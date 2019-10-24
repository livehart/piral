import { relative, join } from 'path';
import { buildPilet } from './build-pilet';
import { postFile, readBinary, matchFiles, createPiletPackage, logWarn, logInfo, logDone, logFail } from '../common';

export interface PublishPiletOptions {
  source?: string;
  url?: string;
  apiKey?: string;
  fresh?: boolean;
}

export const publishPiletDefaults = {
  source: '*.tgz',
  url: '',
  apiKey: '',
  fresh: false,
};

async function getFiles(baseDir: string, source: string, fresh: boolean) {
  if (fresh) {
    const details = require(join(baseDir, 'package.json'));
    await buildPilet(baseDir, {
      target: details.main,
      fresh: true,
    });
    const file = await createPiletPackage(baseDir, '.', '.');
    return [file];
  }

  return await matchFiles(baseDir, source);
}

export async function publishPilet(baseDir = process.cwd(), options: PublishPiletOptions = {}) {
  const {
    source = publishPiletDefaults.source,
    url = publishPiletDefaults.url,
    apiKey = publishPiletDefaults.apiKey,
    fresh = publishPiletDefaults.fresh,
  } = options;
  const files = await getFiles(baseDir, source, fresh);

  if (!url) {
    logWarn(`Missing URL of the pilet feed!`);
    throw new Error('Incomplete configuration.');
  }

  if (files.length === 0) {
    return logFail(`No files found at '%s'.`, source);
  }

  for (const file of files) {
    const fileName = relative(baseDir, file);
    const content = await readBinary(baseDir, fileName);

    if (!content) {
      logWarn(`Content of '%s' cannot be read.`, fileName);
      continue;
    }

    logInfo(`Publishing '%s' to '%s' ...`, file, url);
    const result = await postFile(url, apiKey, content);

    if (result) {
      logDone(`Uploaded successfully!`);
    } else {
      throw new Error('Could not upload.');
    }
  }

  logInfo('All done!');
}