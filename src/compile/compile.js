'use strict';
const fs = require('fs');
const readline = require('readline');
const { writeToBuild } = require('../utils/fileio');

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

  for await (const fullLine of rl) {
    const line = fullLine.trim();
    if (cssFlag) {
      if (line === '</style>') {
        cssFlag = false;
      } else {
        cssOutput += line + '\n';
      }
    } else if (jsFlag) {
      if (line === '</script>') {
        jsFlag = false;
      } else {
        jsOutput += line + '\n';
      }
    } else {
      if (line.substring(0, 6) === 'import') {
        // Get an array of the relative component path
        // striped of quotes and split on '/'
        const relativeComponentPathList = line
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
        const componentName = componentFile.substring(
          0,
          componentFile.length - 5
        );
        // Add component name and component root path to components object
        components[componentName] = componentRootPath;
      } else if (isComponent(line, components)) {
        const name = getComponentName(line);
        const attrs = getComponentAttrs(line);
        const [html, css, js] = await buildOutput(components[name], attrs);
        htmlOutput += html;
        cssOutput += css;
        jsOutput += js;
      } else if (hasAttrToken(line, attrs)) {
        for (const attrName in attrs) {
          const attrToken = `{${attrName}}`;
          const attrValue = attrs[attrName];
          if (line.includes(attrToken)) {
            htmlOutput += line.replace(attrToken, attrValue) + '\n';
          }
        }
      } else if (line === '<style>') {
        cssFlag = true;
      } else if (line === '<script>') {
        jsFlag = true;
      } else {
        htmlOutput += line + '\n';
      }
    }
  }

  return [htmlOutput, cssOutput, jsOutput];
}

// ----- Helper Functions -----

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

function hasAttrToken(line, attrs) {
  for (const attrName in attrs) {
    if (line.includes(`{${attrName}}`)) {
      return true;
    }
  }
  return false;
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

module.exports = {
  compile,
};