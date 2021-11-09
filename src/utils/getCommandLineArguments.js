function getCommandLineArguments() {
  const command = process.argv[2];

  if (command === 'build') {
    let entryPointPath = process.argv[3];
    let buildDirectoryPath = process.argv[4];
    let assetDirectoryPath = process.argv[5];

    // If the entry point path or build path are not
    // provided set default paths
    if (entryPointPath === undefined) {
      entryPointPath = './src/index.html';
    }
    if (buildDirectoryPath === undefined) {
      buildDirectoryPath = './build';
    }

    return [entryPointPath, buildDirectoryPath, assetDirectoryPath];
  } else {
    throw new Error('Please specify a valid command.');
  }
}

module.exports = {
  getCommandLineArguments,
};
