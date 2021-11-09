const { clear, copyDir, getCommandLineArguments } = require('./utils');
const { compile } = require('./compile');

async function main() {
  // Get command line arguments
  const [
    entryPoint,
    buildDirectory,
    assetDirectory,
  ] = getCommandLineArguments();

  // Clear the build directory if it exists and
  // create a new build directory if it does not
  clear(buildDirectory);

  // If an asset directory path was given, copy
  // its contents into the build directory
  if (assetDirectory) {
    copyDir(assetDirectory, buildDirectory);
  }

  // Compile and build PoppyHTML
  await compile(entryPoint, buildDirectory);

  console.log('Build created 🎉\n');
}

main();
