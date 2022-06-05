#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import yaml from 'js-yaml';

async function main() {
  console.time('Build');
  const [buildDirectory] = getCommandLineArguments();
  const publicDirectory = 'public';

  // Clear the build directory if it exists and
  // create a new build directory if it does not
  delDir(buildDirectory);
  createDir(buildDirectory);

  // Copy the public and web components directories
  // to the build directory if they exist
  copyDir(publicDirectory, buildDirectory);
  copyDir('src/components/wc', buildDirectory);

  await buildPages(buildDirectory, `${process.cwd()}/src/pages`);

  console.log();
  console.timeEnd('Build');
  console.log('\n✨ Build complete! ✨');
}

async function buildPages(buildDirectory, pagesDirectory) {
  const [template, templateStyles] = await getPageTemplate(pagesDirectory);
  const files = fs.readdirSync(pagesDirectory);

  for (const file of files) {
    if (file === '_template.js') {
      continue;
    }

    const fileExtension = path.extname(file);
    const currFilePath = `${pagesDirectory}/${file}`;

    // If a nested pages directory exists, recursively build it
    if (fs.lstatSync(`${currFilePath}`).isDirectory()) {
      createDir(`${buildDirectory}/${file}`);
      await buildPages(`${buildDirectory}/${file}`, `${currFilePath}`);
    } else {
      // Otherwise build the page
      if (fileExtension === '.md') {
        buildMarkdownPage(
          file,
          currFilePath,
          template,
          templateStyles,
          buildDirectory
        );
      } else {
        await buildJavaScriptPage(
          file,
          currFilePath,
          template,
          templateStyles,
          buildDirectory
        );
      }
    }
  }
}

function buildMarkdownPage(
  file,
  currFilePath,
  template,
  templateStyles,
  buildDirectory
) {
  const pageName = file.replace('.md', '');
  console.log(`Building ${pageName} page...`);

  const markdown = fs.readFileSync(`${currFilePath}`, 'utf8');
  const metadata = parseMarkdownMetadata(markdown);
  const styles = metadata.styles || '';
  // TODO: Bug where markdown horizontal rules are not rendered
  const html = marked.parse(markdown.replace(/^---$.*^---$/ms, ''));

  let pageOutput = '';
  if (template) {
    switch (metadata.useTemplate) {
      case false:
        pageOutput = html;
        pageOutput = addStyles(
          pageOutput,
          styles,
          '',
          metadata.inlineCSS,
          buildDirectory,
          pageName
        );
        break;
      default:
        // When metadata.useTemplate is undefined or set to true,
        // the template will be used
        pageOutput = template(html, metadata);
        pageOutput = addStyles(
          pageOutput,
          styles,
          templateStyles,
          metadata.inlineCSS,
          buildDirectory,
          pageName
        );
        break;
    }
  } else {
    // If a _template.js file does not exist in the given
    // directory, build page output without it
    pageOutput = html;
    pageOutput = addStyles(
      pageOutput,
      styles,
      '',
      metadata.inlineCSS,
      buildDirectory,
      pageName
    );
  }
  pageOutput = addWebComponentScriptTags(pageOutput);
  writeToBuildDirectory(pageOutput, buildDirectory, `${pageName}.html`);
}

async function buildJavaScriptPage(
  file,
  currFilePath,
  template,
  templateStyles,
  buildDirectory
) {
  const pageName = file.replace('.js', '');
  console.log(`Building ${pageName} page...`);

  const { page, styles = '', metadata = {} } = await import(`${currFilePath}`);

  let pageOutput = '';
  if (template) {
    switch (metadata.useTemplate) {
      case false:
        pageOutput = page();
        pageOutput = addStyles(
          pageOutput,
          styles,
          '',
          metadata.inlineCSS,
          buildDirectory,
          pageName
        );
        break;
      default:
        // When metadata.useTemplate is undefined or set to true,
        // the template will be used
        pageOutput = template(page(), metadata);
        pageOutput = addStyles(
          pageOutput,
          styles,
          templateStyles,
          metadata.inlineCSS,
          buildDirectory,
          pageName
        );
        break;
    }
  } else {
    // If a _template.js file does not exist in the given
    // directory, build page output without it
    pageOutput = page();
    pageOutput = addStyles(
      pageOutput,
      styles,
      '',
      metadata.inlineCSS,
      buildDirectory,
      pageName
    );
  }
  pageOutput = addWebComponentScriptTags(pageOutput);
  writeToBuildDirectory(pageOutput, buildDirectory, `${pageName}.html`);
}

async function getPageTemplate(pagesDirectory) {
  const templatePath = `${pagesDirectory}/_template.js`;
  if (!fs.existsSync(templatePath)) {
    return [undefined, ''];
  }

  try {
    const { template, styles = '' } = await import(templatePath);
    return [template, styles];
  } catch (err) {
    throw err;
  }
}

function addStyles(
  output,
  pageStyles,
  templateStyles,
  isInlineCSS = true,
  buildDirectory,
  pageName
) {
  const styles = `${pageStyles}${templateStyles}`;
  if (styles.length > 0) {
    if (isInlineCSS) {
      output = output.replace('</head>', `<style>${styles}</style>\n</head>`);
    } else {
      writeToBuildDirectory(styles, buildDirectory, `${pageName}.css`);
      output = output.replace(
        '</head>',
        `<link rel="stylesheet" href="./${pageName}.css" />\n</head>`
      );
    }
  }
  return output;
}

function addWebComponentScriptTags(output) {
  const wcFiles = fs.readdirSync('build/wc');
  for (const file of wcFiles) {
    const wcName = file.replace('.js', '');
    if (output.includes(`<${wcName}>`) && output.includes(`</${wcName}>`)) {
      // TODO: Edge case when script tag is placed in nested dir (e.g. `../../wc/file.js`)
      const wcScript = `<script type="module" src="./wc/${file}"></script>`;
      output = output.replace(`</head>`, `${wcScript}\n</head>`);
    }
  }
  return output;
}

function writeToBuildDirectory(output, buildDirectory, file) {
  fs.appendFile(`${buildDirectory}/${file}`, output, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

// General utilities

/**
 *
 * @param {string} markdown
 * @returns
 */
function parseMarkdownMetadata(markdown) {
  const pattern =
    /(^-{3}(?:\r\n|\r|\n)([\w\W]*?)-{3}(?:\r\n|\r|\n))?([\w\W]*)*/;

  let metadata = {};
  const matches = markdown.match(pattern);

  if (matches[2]) {
    const parse = yaml.load;
    try {
      metadata = parse(matches[2]) || {};
    } catch (err) {
      throw err;
    }
  }

  return metadata;
}

function getCommandLineArguments() {
  const command = process.argv[2];

  switch (command) {
    case 'build':
      let buildDirectoryPath = process.argv[3] ? process.argv[3] : './build';
      return [buildDirectoryPath];
    default:
      console.error('Invalid command.');
      break;
  }
}

function delDir(path) {
  if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
    fs.readdirSync(path).forEach(function (file, index) {
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

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function copyDir(source, target) {
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
          copyFileSync(curSource, targetFolder);
        }
      });
    }
  }
}

function copyFileSync(source, target) {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

main();
