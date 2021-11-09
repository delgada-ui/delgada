const { clear } = require('./clear');
const { copyDir } = require('./copyDir');
const { writeToBuildDirectory } = require('./writeToBuildDirectory');
const { getCommandLineArguments } = require('./getCommandLineArguments');

module.exports = {
  clear,
  copyDir,
  getCommandLineArguments,
  writeToBuildDirectory,
};
