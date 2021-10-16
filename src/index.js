const { clear, copyDir } = require('./utils');
const { compile } = require('./compile');

async function main() {
  // Get command line arguments
  const entryPoint = process.argv[2];
  const buildDirectory = process.argv[3];
  const assetDirectory = process.argv[4];

  // Clear the build directory if it exists
  clear(buildDirectory);

  console.log('\nCompiling source code...');

  await compile(entryPoint, buildDirectory);

  // If an asset directory path was given, copy
  // its contents into the build directory
  if (assetDirectory) {
    copyDir(assetDirectory, buildDirectory);
  }

  console.log('Build created 🎉\n');
}

main();
