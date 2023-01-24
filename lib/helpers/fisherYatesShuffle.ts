export default function fisherYatesShuffle<T>(array: T[]) {
  const toShuffle = [...array];

  for (let i = (toShuffle.length - 1); i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * i);
    [toShuffle[i], toShuffle[randomIndex]] = [toShuffle[randomIndex], toShuffle[i]];
  }

  return toShuffle;
}