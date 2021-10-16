const fs = require('fs/promises');
const { parse } = require('node-html-parser');

async function parseFile(path) {
  const buffer = await fs.readFile(path);
  const html = buffer.toString();
  const root = parse(html, { comment: true });
  return root;
}

module.exports = {
  parseFile,
};
