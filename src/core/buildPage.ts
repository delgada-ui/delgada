import fs from 'fs';
import { marked } from 'marked';
import { writeFile } from './dir.js';
import { addStyles } from './styles.js';
import { addWebComponentScriptTags } from './webComponents.js';
import { parseMarkdownMetadata } from './markdown.js';

export async function buildPage(
  buildDirectory: string,
  currFilePath: string,
  file: string,
  fileExtension: string,
  template: any,
  templateStyles: string
) {
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

  // const pageName = file.replace('.js', '');
  // console.log(`Building ${pageName} page...`);

  // const {
  //   page,
  //   styles = '',
  //   metadata = {},
  // } = await import(`${pagesDirectory}/${file}`);

  // let pageOutput = '';
  // if (template) {
  //   switch (metadata.useTemplate) {
  //     case false:
  //       pageOutput = page();
  //       pageOutput = addStyles(
  //         pageOutput,
  //         styles,
  //         '',
  //         metadata.inlineCSS,
  //         buildDirectory,
  //         pageName
  //       );
  //       break;
  //     default:
  //       // When metadata.useTemplate is undefined or set to true,
  //       // the template will be used
  //       pageOutput = template(page(), metadata);
  //       pageOutput = addStyles(
  //         pageOutput,
  //         styles,
  //         templateStyles,
  //         metadata.inlineCSS,
  //         buildDirectory,
  //         pageName
  //       );
  //       break;
  //   }
  // } else {
  //   // If a _template.js file does not exist in the given
  //   // directory, build page output without it
  //   pageOutput = page();
  //   pageOutput = addStyles(
  //     pageOutput,
  //     styles,
  //     '',
  //     metadata.inlineCSS,
  //     buildDirectory,
  //     pageName
  //   );
  // }
  // pageOutput = addWebComponentScriptTags(pageOutput);
  // writeFile(`${buildDirectory}/${pageName}.html`, pageOutput);
}

function buildMarkdownPage(
  file: string,
  currFilePath: string,
  template: any,
  templateStyles: string,
  buildDirectory: string
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
  writeFile(`${buildDirectory}/${pageName}.html`, pageOutput);
}

async function buildJavaScriptPage(
  file: string,
  currFilePath: string,
  template: any,
  templateStyles: string,
  buildDirectory: string
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
  writeFile(`${buildDirectory}/${pageName}.html`, pageOutput);
}
