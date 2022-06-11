import fs from 'fs';

export function addWebComponentScriptTags(output: string) {
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
