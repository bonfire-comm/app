export function detectColorTone(r: number, g: number, b: number) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'light' : 'dark';
}

export default function getSignificantColor(image: HTMLImageElement): { color: string; tone: 'light' | 'dark' } {
  const canvas = document.createElement('canvas');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const context = canvas.getContext('2d')!;
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0, image.width, image.height);

  const imageData = context.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;
  const colorCounts: { [key: number]: number } = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const alpha = pixels[i + 3];

    // ignore transparent pixels
    if (alpha === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-bitwise
    const color = (red << 16) | (green << 8) | blue;
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }

  const significantColor = parseInt(Object.entries(colorCounts).reduce(
    (acc, [color, count]) => (count > acc[1] ? [color, count] : acc),
    ['0', 0],
  )[0], 10);

  // eslint-disable-next-line no-bitwise
  const r = (significantColor >> 16) & 0xff;
  // eslint-disable-next-line no-bitwise
  const g = (significantColor >> 8) & 0xff;
  // eslint-disable-next-line no-bitwise
  const b = significantColor & 0xff;
  const color = `rgb(${r}, ${g}, ${b})`;

  return {
    color,
    tone: detectColorTone(r, g, b)
  };
}
