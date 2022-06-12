#!/usr/bin/env node
import { build } from './build.js';

async function main() {
  const command = process.argv[2];
  switch (command) {
    case 'build':
      await build();
      break;
    default:
      console.error('Invalid command.');
      break;
  }
}

main();
