export default function getInitials(name: string) {
  const names = name.split(' ');

  return names.map((s) => s[0].toUpperCase()).join('');
}