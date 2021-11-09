function getCommandLineArguments() {
  let entryPointPath = process.argv[2];
  let buildDirectoryPath = process.argv[3];
  let assetDirectoryPath = process.argv[4];

  // If the entry point path or build path are not
  // provided set default paths
  if (entryPointPath === undefined) {
    entryPointPath = './src/index.html';
  }
  if (buildDirectoryPath === undefined) {
    buildDirectoryPath = './build';
  }

  return [entryPointPath, buildDirectoryPath, assetDirectoryPath];
}

module.exports = {
  getCommandLineArguments,
};
