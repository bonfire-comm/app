import 'highlight.js/styles/github-dark.css';

import { toHtml } from 'hast-util-to-html';
import { lowlightInstance } from '@/components/TextEditor';

export default function highlightElement(element: HTMLDivElement) {
  const els = element.querySelectorAll<HTMLElement>('pre code');
  els.forEach((el) => {
    try {
      const lang = el.className.split('-')[1];
      const tree = lowlightInstance.highlight(lang, el.innerHTML.trim());
      const html = toHtml(tree);

      // eslint-disable-next-line no-param-reassign
      el.innerHTML = html;
    // eslint-disable-next-line no-empty
    } catch {}
    finally {
      el.classList.add('hljs');
    }
  });
}