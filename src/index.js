#!/usr/bin/env node
'use strict';
const { compile } = require('./compile/compile');
const { create, copyFolderRecursiveSync, del } = require('./utils/fileio');

async function main() {
  const entryPoint = process.argv[2];
  const buildDirectory = process.argv[3];
  const assetDirectory = process.argv[4];

  del(buildDirectory);
  create(buildDirectory);

  console.log('\nCompiling source code...');

  await compile(entryPoint, buildDirectory);

  if (assetDirectory) {
    copyFolderRecursiveSync(assetDirectory, buildDirectory);
  }

  console.log('Build created 🎉\n');
}

main();
