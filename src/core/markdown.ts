import yaml from 'js-yaml';

export function parseMarkdownMetadata(markdown: string) {
  const pattern =
    /(^-{3}(?:\r\n|\r|\n)([\w\W]*?)-{3}(?:\r\n|\r|\n))?([\w\W]*)*/;

  let metadata: any = {};
  const matches = markdown.match(pattern);

  if (matches && matches[2]) {
    const parse = yaml.load;
    try {
      metadata = parse(matches[2]) || {};
    } catch (err) {
      throw err;
    }
  }

  return metadata;
}
