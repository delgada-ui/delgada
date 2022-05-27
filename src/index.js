#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

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
  // TODO: Make template optional
  const template = await getPageTemplate(pagesDirectory);
  const files = fs.readdirSync(pagesDirectory);
  for (const file of files) {
    if (file === '_template.js') {
      continue;
    }
    if (fs.lstatSync(`${pagesDirectory}/${file}`).isDirectory()) {
      createDir(`${buildDirectory}/${file}`);
      await buildPages(
        `${buildDirectory}/${file}`,
        `${pagesDirectory}/${file}`
      );
    } else {
      const pageName = file.replace('.js', '');
      console.log(`Building ${pageName} page...`);

      const { page, styles, metadata } = await import(
        `${pagesDirectory}/${file}`
      );

      let pageOutput = template(page(), metadata);
      pageOutput = addInlineStyles(pageOutput, styles);
      pageOutput = addWebComponentScriptTags(pageOutput);
      writeToBuildDirectory(pageOutput, buildDirectory, `${pageName}.html`);
    }
  }
}

async function getPageTemplate(pagesDirectory) {
  try {
    const templatePath = `${pagesDirectory}/_template.js`;
    const { default: template } = await import(templatePath);
    return template;
  } catch (err) {
    console.error(err);
  }
}

function addInlineStyles(output, styles) {
  if (styles) {
    const styleTag = `<style>${styles}</style>`;
    output = output.replace('</head>', `${styleTag}\n</head>`);
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

  // if (command === 'build') {
  //   let buildDirectoryPath = process.argv[3];

  //   // If the build path is not provided set a default
  //   if (buildDirectoryPath === undefined) {
  //     buildDirectoryPath = './build';
  //   }

  //   return [buildDirectoryPath];
  // } else {
  //   throw new Error('Please specify a valid command.');
  // }
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
