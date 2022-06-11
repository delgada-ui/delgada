export function html(strings: string[], ...values: any[]) {
  const parts = [strings[0]];

  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] === 'object') {
      values[i].map((value: any) => {
        parts.push(String(value));
      });
    } else {
      parts.push(String(values[i]));
    }
    parts.push(strings[i + 1]);
  }

  return parts.join('');
}

export const css = html;
