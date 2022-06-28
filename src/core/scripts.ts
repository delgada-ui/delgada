export function addScripts(output: string, scripts: string[]) {
  if (scripts) {
    for (const file of scripts) {
      const scriptTag = `<script type="module" src="/${file}"></script>`;
      output = output.replace(`</head>`, `${scriptTag}\n</head>`);
    }
  }
  return output;
}
