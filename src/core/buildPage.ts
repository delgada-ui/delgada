import fs from 'fs';
import { marked } from 'marked';
import { writeFile } from './dir.js';
import { addStyles } from './styles.js';
import { addWebComponentScriptTags } from './webComponents.js';
import { parseMarkdownMetadata } from './markdown.js';

export async function buildPage(
  buildDirectory: string,
  currFilePath: string,
  pageName: string,
  fileExtension: string,
  template: any,
  templateStyles: string
) {
  let pageHtml = '';
  let pageStyles = '';
  let pageMetadata: any = {};

  if (fileExtension === '.js') {
    const {
      page,
      styles = '',
      metadata = {},
    } = await import(`${currFilePath}`);
    pageHtml = page();
    pageStyles = styles;
    pageMetadata = metadata;
  } else {
    const markdown = fs.readFileSync(`${currFilePath}`, 'utf8');
    pageMetadata = parseMarkdownMetadata(markdown);
    pageStyles = pageMetadata.styles || '';
    // TODO: Bug where markdown horizontal rules are not rendered
    pageHtml = marked.parse(markdown.replace(/^---$.*^---$/ms, ''));
  }

  let pageOutput = '';
  if (!template || pageMetadata.useTemplate === false) {
    // If a _template.js file does not exist in the given
    // directory or the useTemplate config is set to false,
    // build page output without it
    pageOutput = pageHtml;
    templateStyles = '';
  } else {
    // When metadata.useTemplate is undefined or set to true,
    // the template will be used
    pageOutput = template(pageHtml, pageMetadata);
  }

  pageOutput = addStyles(
    pageOutput,
    pageStyles,
    templateStyles,
    pageMetadata.inlineCSS,
    buildDirectory,
    pageName
  );
  pageOutput = addWebComponentScriptTags(pageOutput);
  writeFile(`${buildDirectory}/${pageName}.html`, pageOutput);
}
