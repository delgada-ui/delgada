import { writeFile } from './dir.js';

export function addStyles(
  output: string,
  pageStyles: string,
  templateStyles: string,
  isInlineCSS = true,
  buildDirectory: string,
  pageName: string
) {
  const styles = `${pageStyles}${templateStyles}`;
  if (styles.length > 0) {
    if (isInlineCSS) {
      output = output.replace('</head>', `<style>${styles}</style>\n</head>`);
    } else {
      writeFile(`${buildDirectory}/${pageName}.css`, styles);
      output = output.replace(
        '</head>',
        `<link rel="stylesheet" href="./${pageName}.css" />\n</head>`
      );
    }
  }
  return output;
}
