const { parseFile } = require('../parse');
const { writeToBuildDirectory } = require('../utils');

async function compile(entryPoint, buildDirectory) {
  // Compile and build source code into separate HTML, CSS, and JS outputs
  let [html, css, js] = await buildOutput(entryPoint, {});

  if (html.length > 0) {
    writeToBuildDirectory(html, buildDirectory, 'index.html');
  }
  if (css.length > 0) {
    writeToBuildDirectory(css, buildDirectory, 'index.css');
  }
  if (js.length > 0) {
    writeToBuildDirectory(js, buildDirectory, 'index.js');
  }
}

async function buildOutput(path, componentProps) {
  const root = await parseFile(path);

  const importedComponents = {};
  let htmlOutput = '';
  let cssOutput = '';
  let jsOutput = '';

  for (const node of root.childNodes) {
    // Get node type (we only care about comment or HTML element)
    const nodeType = node.constructor.name;

    if (nodeType === 'CommentNode') {
      const commentText = node.textContent;
      if (commentText.includes('import')) {
        saveImportedComponent(commentText, path, importedComponents);
      }
    } else if (nodeType === 'HTMLElement') {
      const tagName = node.rawTagName;
      if (tagName === 'script') {
        jsOutput += node.innerHTML;
      } else if (tagName === 'style') {
        cssOutput += node.innerHTML;
      } else {
        if (htmlSubtreeHasPropExpression(node, componentProps)) {
          let subtreeHTML = node.outerHTML;
          for (const propName in componentProps) {
            const propExpression = `{${propName}}`;
            if (node.outerHTML.includes(propExpression)) {
              const propValue = componentProps[propName];
              subtreeHTML = subtreeHTML.replace(propExpression, propValue);
            }
          }
          htmlOutput += subtreeHTML;
        } else if (htmlSubtreeContainsComponent(node, importedComponents)) {
          let subtreeHTML = node.outerHTML;
          for (const componentName in importedComponents) {
            if (node.structure.includes(componentName)) {
              const componentNodeList = node.getElementsByTagName(componentName);
              for (const componentNode of componentNodeList) {
                const componentName = componentNode.rawTagName;
                const componentFilePath = importedComponents[componentName];
                const props = componentNode.attributes;

                const [html, css, js] = await buildOutput(componentFilePath, props);

                const componentNodeHTML = componentNode.outerHTML;
                subtreeHTML = subtreeHTML.replace(componentNodeHTML, html);

                cssOutput += css;
                jsOutput += js;
              }
            }
          }
          htmlOutput += subtreeHTML;
        } else {
          htmlOutput += node.outerHTML;
        }
      }
    }
  }

  return [htmlOutput, cssOutput, jsOutput];
}

// Checks if the given line contains a prop expression
// which takes the form of: {prop}
function htmlSubtreeHasPropExpression(node, props) {
  for (const propName in props) {
    if (node.outerHTML.includes(`{${propName}}`)) {
      return true;
    }
  }
  return false;
}

function htmlSubtreeContainsComponent(node, importedComponents) {
  for (const componentName in importedComponents) {
    if (node.structure.includes(componentName)) {
      return true;
    }
  }
  return false;
}

function saveImportedComponent(commentText, path, importedComponents) {
  const lines = commentText.split('\n');
  for (const fullLine of lines) {
    const line = fullLine.trim();
    if (line.startsWith('import')) {
      const componentRootPath = getComponentPathFromProjectRoot(line, path);
      const componentName = getComponentNameFromFilePath(componentRootPath);
      importedComponents[componentName] = componentRootPath;
    }
  }
}

function getComponentPathFromProjectRoot(line, path) {
  // Get an array of the relative component path
  // striped of quotes and split on '/'
  const relativeComponentPathList = line.split(' ')[1].trim().replace(/['"]+/g, '').split('/');
  const rootPathList = path.split('/');
  const rootPathListWithoutFile = rootPathList.slice(0, rootPathList.length - 1);
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

module.exports = {
  compile,
};
