import { writeFile } from './dir.js';
import { addStyles } from './styles.js';
import { addWebComponentScriptTags } from './webComponents.js';

export async function buildPage(
  buildDirectory: string,
  pagesDirectory: string,
  file: string,
  template: any,
  templateStyles: string
) {
  const pageName = file.replace('.js', '');
  console.log(`Building ${pageName} page...`);

  const {
    page,
    styles = '',
    metadata = {},
  } = await import(`${pagesDirectory}/${file}`);

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
