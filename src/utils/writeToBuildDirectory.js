const fs = require('fs');

function writeToBuildDirectory(output, buildDirectory, file) {
  fs.appendFile(`${buildDirectory}/${file}`, output, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

module.exports = {
  writeToBuildDirectory,
};
