import fs from 'fs';
import path from 'path';

export function writeFile(path: string, contents: string) {
  fs.appendFile(path, contents, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

export function delDir(path: string) {
  if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
    fs.readdirSync(path).forEach(function (file) {
      const currPath = path + '/' + file;
      if (fs.lstatSync(currPath).isDirectory()) {
        delDir(currPath);
      } else {
        fs.unlinkSync(currPath);
      }
    });
    fs.rmdirSync(path);
  }
}

export function createDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

export function copyDir(source: string, target: string) {
  if (fs.existsSync(source)) {
    let files = [];

    // Check if folder needs to be created or integrated
    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder);
    }

    // Copy
    if (fs.lstatSync(source).isDirectory()) {
      files = fs.readdirSync(source);
      files.forEach(function (file) {
        const curSource = path.join(source, file);
        if (fs.lstatSync(curSource).isDirectory()) {
          copyDir(curSource, targetFolder);
        } else {
          copyFile(curSource, targetFolder);
        }
      });
    }
  }
}

export function copyFile(source: string, target: string) {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}
