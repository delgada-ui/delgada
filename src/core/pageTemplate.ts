import fs from 'fs';

export async function getPageTemplate(
  pagesDirectory: string
): Promise<[any, string]> {
  const templatePath = `${pagesDirectory}/_template.js`;
  if (!fs.existsSync(templatePath)) {
    return [undefined, ''];
  }

  try {
    const { template, styles = '' } = await import(templatePath);
    return [template, styles];
  } catch (err) {
    console.error(err);
    return [undefined, ''];
  }
}
