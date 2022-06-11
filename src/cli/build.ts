import fs from 'fs';
import path from 'path';
import { delDir, createDir, copyDir } from '../core/dir.js';
import { buildPage } from '../core/buildPage.js';
import { getPageTemplate } from '../core/pageTemplate.js';

export async function build(buildDirectory: string) {
  const startTime = performance.now();
  const publicDirectory = 'public';

  // Clear the build directory if it exists and
  // create a new build directory if it does not
  delDir(buildDirectory);
  createDir(buildDirectory);

  // Copy the public and web components directories
  // to the build directory if they exist
  copyDir(publicDirectory, buildDirectory);
  copyDir('src/components/wc', buildDirectory);

  const pagesDirectory = `${process.cwd()}/src/pages`;
  await buildPages(buildDirectory, pagesDirectory);

  const buildTime = (performance.now() - startTime).toFixed(3);
  console.log(`\n✨ Build complete (in ${buildTime}ms)! ✨`);
}

async function buildPages(buildDirectory: string, pagesDirectory: string) {
  const [template, templateStyles] = await getPageTemplate(pagesDirectory);
  const files = fs.readdirSync(pagesDirectory);
  for (const file of files) {
    if (file === '_template.js') {
      continue;
    }

    const currFilePath = `${pagesDirectory}/${file}`;

    // If a nested pages directory exists, recursively build it
    if (fs.lstatSync(`${currFilePath}`).isDirectory()) {
      createDir(`${buildDirectory}/${file}`);
      await buildPages(`${buildDirectory}/${file}`, `${currFilePath}`);
    } else {
      const fileExtension = path.extname(file);
      let pageName = '';
      switch (fileExtension) {
        case '.js':
          pageName = file.replace('.js', '');
          break;
        case '.md':
          pageName = file.replace('.md', '');
          break;
        default:
          throw new Error(
            `Invalid page file type: ${fileExtension}. Must be a .js or .md file.`
          );
      }

      console.log(`Building ${pageName} page...`);
      buildPage(
        buildDirectory,
        currFilePath,
        pageName,
        fileExtension,
        template,
        templateStyles
      );
    }
  }
}
