export default function trimEmptyParagraphTag(content: string) {
  let result = content.replace(/(^<p><\/p>|<p><\/p>$)/g, '');
  let iteration = 0;

  while (iteration <= 20) {
    const temp = result.replace(/(^<p><\/p>|<p><\/p>$)/g, '');

    if (result === temp) return temp;

    result = temp;
    iteration += 1;
  }

  return result;
}