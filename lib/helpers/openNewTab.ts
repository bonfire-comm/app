export default function openNewTab(url: string) {
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  win?.focus();
}