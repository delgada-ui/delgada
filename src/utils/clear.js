const fs = require('fs');

function clear(path) {
  del(path);
  create(path);
}

function del(path) {
  if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
    fs.readdirSync(path).forEach(function (file, index) {
      const currPath = path + '/' + file;
      if (fs.lstatSync(currPath).isDirectory()) {
        del(currPath);
      } else {
        fs.unlinkSync(currPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function create(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

module.exports = {
  clear,
};
