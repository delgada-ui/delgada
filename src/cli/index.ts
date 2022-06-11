#!/usr/bin/env node
import { build } from './build.js';

async function main() {
  const command = process.argv[2];
  switch (command) {
    case 'build':
      let buildDirectoryPath = process.argv[3] ? process.argv[3] : './build';
      build(buildDirectoryPath);
      break;
    default:
      console.error('Invalid command.');
      break;
  }
}

main();
