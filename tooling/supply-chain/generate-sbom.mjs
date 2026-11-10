#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';

import { generateSbom } from './sbom-lib.mjs';

const options = parseArguments(process.argv.slice(2));
const rootDirectory = resolve(options.root ?? process.cwd());
const output = isAbsolute(options.output ?? '')
  ? options.output
  : resolve(rootDirectory, options.output ?? 'outputs/sbom.cdx.json');
const sbom = await generateSbom({
  rootDirectory,
  includeDev: options.includeDev,
  timestamp: options.timestamp ?? process.env.SOURCE_DATE_EPOCH,
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
process.stdout.write(`${output}\n`);

/** @param {string[]} arguments_ */
function parseArguments(arguments_) {
  const result = { includeDev: false };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--include-dev') {
      result.includeDev = true;
      continue;
    }
    if (argument === '--root' || argument === '--output' || argument === '--timestamp') {
      const value = arguments_[index + 1];
      if (!value) throw new Error(`${argument} requires a value.`);
      result[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}
