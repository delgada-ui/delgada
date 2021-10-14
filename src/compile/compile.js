'use strict';
const {
  createReadlineInterface,
  writeToBuildDirectory,
} = require('../utils/fileio');

async function compile(entryPoint, buildDirectory) {
  // Compile and build source code into separate HTML, CSS, and JS outputs
  let [html, css, js] = await buildOutput(entryPoint, {}, []);

  if (html.length > 0) {
    html = cleanUpPass(html);
    writeToBuildDirectory(html, buildDirectory, 'index.html');
  }
  if (css.length > 0) {
    css = cleanUpPass(css);
    writeToBuildDirectory(css, buildDirectory, 'index.css');
  }
  if (js.length > 0) {
    js = cleanUpPass(js);
    writeToBuildDirectory(js, buildDirectory, 'index.js');
  }
}

async function buildOutput(path, props, childElements) {
  const importedComponents = {};
  let htmlOutput = '';
  let cssOutput = '';
  let jsOutput = '';
  let cssFlag = false;
  let jsFlag = false;
  let closingComponent = '';
  let isMultilineComponent = false;
  let multilineComponentProps = {};

  // Create a file stream and readline interface in order
  // to process the given file one line at a time
  const rl = createReadlineInterface(path);

  // Loop through every line in the given file
  for await (const fullLine of rl) {
    const line = fullLine.trim();

    if (jsFlag) {
      if (line === '</script>') {
        jsFlag = false;
      } else {
        jsOutput += line + '\n';
      }
    } else if (cssFlag) {
      if (line === '</style>') {
        cssFlag = false;
      } else {
        cssOutput += line + '\n';
      }
    } else {
      if (isImportStatement(line)) {
        saveImportedComponent(line, path, importedComponents);
      } else if (isComponent(line, importedComponents)) {
        const componentName = getComponentName(line, importedComponents);
        const componentFilePath = importedComponents[componentName];
        const componentProps = getcomponentProps(line);
        isMultilineComponent = !line.includes('/>');

        if (!isMultilineComponent || line === closingComponent) {
          const [html, css, js] = await buildOutput(
            componentFilePath,
            !isMultilineComponent ? componentProps : multilineComponentProps,
            childElements
          );
          htmlOutput += html;
          cssOutput += css;
          jsOutput += js;
        }
        if (line === closingComponent) {
          isMultilineComponent = false;
          closingComponent = '';
          multilineComponentProps = {};
        }
        if (isMultilineComponent) {
          closingComponent = `</${componentName}>`;
          multilineComponentProps = componentProps;
        }
      } else if (isMultilineComponent && line !== closingComponent) {
        if (isComponent(line, importedComponents)) {
          const name = getComponentName(line, importedComponents);
          const componentProps = getcomponentProps(line);
          const [html, css, js] = await buildOutput(
            importedComponents[name],
            componentProps,
            childElements
          );
          childElements = childElements.concat(html.split('\n'));
          cssOutput += css;
          jsOutput += js;
        } else {
          childElements.push(line);
        }
      } else if (hasPropExpression(line, props)) {
        htmlOutput += replacePropExpressionWithPropValue(line, props);
      } else if (isSlotElement(line)) {
        for (const element of childElements) {
          htmlOutput += element + '\n';
        }
        childElements = [];
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

function isImportStatement(line) {
  return line.startsWith('import');
}

function saveImportedComponent(line, path, importedComponents) {
  const componentRootPath = getComponentPathFromProjectRoot(line, path);
  const componentName = getComponentNameFromFilePath(componentRootPath);
  importedComponents[componentName] = componentRootPath;
}

function isSlotElement(line) {
  return line === '<slot />';
}

function getComponentPathFromProjectRoot(line, path) {
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
    .join('/')
    .replace(/(\.\/|\.\.\/)*/g, '');

  return componentRootPath;
}

function getComponentNameFromFilePath(path) {
  const pathList = path.split('/');
  const componentFile = pathList[pathList.length - 1];
  const componentName = componentFile.substring(0, componentFile.length - 5);

  return componentName;
}

function isComponent(line, importedComponents) {
  for (const componentName in importedComponents) {
    if (line.includes(componentName)) {
      return true;
    }
  }
  return false;
}

function getComponentName(line, importedComponents) {
  for (const componentName in importedComponents) {
    if (line.includes(componentName)) {
      return componentName;
    }
  }
  // const componentPartsList = line.split(' ');
  // const componentName = componentPartsList[0]
  //   .substring(1, componentPartsList[0].length)
  //   .trim();
  // return componentName;
}

// <hello title="Hello World!" />
// <hello
//   title="Hello World!"
//   title="Hello World!"
//   title="Hello World!"
//   title="Hello World!"
// />
function getcomponentProps(line) {
  const componentProps = {};
  const attrList = line.match(/[a-z]+\=["']{1}.*?["']{1}/g);
  if (attrList) {
    for (const part of attrList) {
      const attrAndVal = part.split('=');
      const attr = attrAndVal[0];
      const val = attrAndVal[1].replace(/['"]+/g, '');
      componentProps[attr] = val;
    }
  }
  return componentProps;
}

// Checks if the given line contains a prop expression
// which takes the form of: {prop}
function hasPropExpression(line, props) {
  for (const propName in props) {
    if (line.includes(`{${propName}}`)) {
      return true;
    }
  }
  return false;
}

function replacePropExpressionWithPropValue(line, props) {
  for (const propName in props) {
    const propExpression = `{${propName}}`;
    if (line.includes(propExpression)) {
      const propValue = props[propName];
      return line.replace(propExpression, propValue) + '\n';
    }
  }
  return line;
}

function cleanUpPass(code) {
  let output = '';
  const lines = code.split('\n');
  for (const line of lines) {
    if (line === '<!--' || line === '-->' || line === '') {
      // Do nothing
      // Note: This bit of code means that multiline HTML comments are not possible
    } else {
      output += line + '\n';
    }
  }
  return output;
}

module.exports = {
  compile,
};
