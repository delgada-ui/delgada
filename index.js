#!/usr/bin/env node
'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function main() {
  const entryPoint = process.argv[2];
  const buildDirectory = process.argv[3];
  const assetDirectory = process.argv[4];

  del(buildDirectory);
  create(buildDirectory);

  await compile(entryPoint, buildDirectory);

  if (assetDirectory) {
    copyFolderRecursiveSync(assetDirectory, buildDirectory);
  }
}

async function compile(entryPoint, buildDirectory) {
  let [html, css, js] = await buildOutput(entryPoint, {});
  if (html.length > 0) {
    html = cleanUpPass(html);
    writeToBuild(html, buildDirectory, 'index.html');
  }
  if (css.length > 0) {
    css = cleanUpPass(css);
    writeToBuild(css, buildDirectory, 'index.css');
  }
  if (js.length > 0) {
    js = cleanUpPass(js);
    writeToBuild(js, buildDirectory, 'index.js');
  }
}

async function buildOutput(path, attrs) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const components = {};
  let htmlOutput = '';
  let cssOutput = '';
  let jsOutput = '';
  let cssFlag = false;
  let jsFlag = false;

  for await (const line of rl) {
    if (cssFlag) {
      if (line.trim() === '</style>') {
        cssFlag = false;
      } else {
        cssOutput += line.trim() + '\n';
      }
    } else if (jsFlag) {
      if (line.trim() === '</script>') {
        jsFlag = false;
      } else {
        jsOutput += line.trim() + '\n';
      }
    } else {
      if (line.trim().substring(0, 6) === 'import') {
        // Get an array of the relative component path
        // striped of quotes and split on '/'
        const relativeComponentPathList = line
          .trim()
          .split(' ')[1]
          .trim()
          .replace(/['"]+/g, '')
          .split('/');
        const rootPathList = path.split('/');
        const rootPathListWithoutFile = rootPathList.slice(
          0,
          rootPathList.length - 1
        );
        const componentRootPath = rootPathListWithoutFile
          .concat(relativeComponentPathList)
          .join('/');
        const componentFile =
          relativeComponentPathList[relativeComponentPathList.length - 1];
        const componentName = capitalizeFirstLetter(
          componentFile.substring(0, componentFile.length - 5)
        );
        // Add component name and component root path to components object
        components[componentName] = componentRootPath;
      } else if (isComponent(line.trim(), components)) {
        const name = getComponentName(line.trim());
        const attrs = getComponentAttrs(line.trim());
        const [html, css, js] = await buildOutput(components[name], attrs);
        htmlOutput += html;
        cssOutput += css;
        jsOutput += js;
      } else if (hasAttrToken(line.trim(), attrs)) {
        for (const attrName in attrs) {
          const attrToken = `{${attrName}}`;
          const attrValue = attrs[attrName];
          if (line.includes(attrToken)) {
            htmlOutput += line.replace(attrToken, attrValue) + '\n';
          }
        }
      } else if (line.trim() === '<style>') {
        cssFlag = true;
      } else if (line.trim() === '<script>') {
        jsFlag = true;
      } else {
        htmlOutput += line.trim() + '\n';
      }
    }
  }

  return [htmlOutput, cssOutput, jsOutput];
}

// ----- Helper Functions -----

function hasAttrToken(line, attrs) {
  for (const attrName in attrs) {
    if (line.includes(`{${attrName}}`)) {
      return true;
    }
  }
  return false;
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

function cleanUpPass(code) {
  let output = '';
  const lines = code.split('\n');
  for (const line of lines) {
    if (line === '<!--' || line === '-->' || line === '') {
      // Do nothing
      // Note: This bit of code means that multiline HTML comments are not possible¡
    } else {
      output += line + '\n';
    }
  }
  return output;
}

function writeToBuild(output, buildDirectory, file) {
  fs.appendFile(`${buildDirectory}/${file}`, output, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function isComponent(line, components) {
  const name = getComponentName(line);
  return components.hasOwnProperty(name);
}

function getComponentName(line) {
  const componentPartsList = line.split(' ');
  const componentName = componentPartsList[0]
    .substring(1, componentPartsList[0].length)
    .trim();
  return componentName;
}

// <hello title="Hello World!" />
// <hello
//   title="Hello World!"
//   title="Hello World!"
//   title="Hello World!"
//   title="Hello World!"
// />
function getComponentAttrs(line) {
  const componentAttrs = {};
  const attrList = line.match(/[a-z]+\=["']{1}.*?["']{1}/g);
  if (attrList) {
    for (const part of attrList) {
      const attrAndVal = part.split('=');
      const attr = attrAndVal[0];
      const val = attrAndVal[1].replace(/['"]+/g, '');
      componentAttrs[attr] = val;
    }
  }
  return componentAttrs;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function copyFileSync(source, target) {
  var targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

main();
