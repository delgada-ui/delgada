import fs from 'fs';
import path from 'path';
import { delDir, createDir, copyDirContents } from '../core/dir.js';
import { buildPage } from '../core/buildPage.js';
import { getPageTemplate } from '../core/pageTemplate.js';

export async function build() {
  const startTime = performance.now();
  const cwd = process.cwd();
  const buildDirectory = `${cwd}/build`;
  const publicDirectory = `${cwd}/public`;
  const wcDirectory = `${cwd}/src/components/wc`;
  const pagesDirectory = `${cwd}/src/pages`;

  delDir(buildDirectory);
  createDir(buildDirectory);
  copyDirContents(publicDirectory, buildDirectory);
  copyDirContents(wcDirectory, buildDirectory);

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
      await buildPage(
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
