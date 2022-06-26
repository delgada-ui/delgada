import fs from 'fs';
import path from 'path';

export function addWebComponents(output: string) {
  const buildFiles = fs.readdirSync('build');
  for (const file of buildFiles) {
    const fileExtension = path.extname(file);
    if (fileExtension === '.js') {
      const wcName = file.replace('.js', '');
      // Developer note: When checking for an opening tag, we leave out the 
      // closing alligator (`>`) because the web component might include attributes.
      if (output.includes(`<${wcName}`) && output.includes(`</${wcName}>`)) {
        const wcScript = `<script type="module" src="/${file}"></script>`;
        output = output.replace(`</head>`, `${wcScript}\n</head>`);
      }
    }
  }
  return output;
}
