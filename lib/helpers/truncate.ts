export default function truncate(str: string, length = 50, ending = '...') {
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  }

  return str;

}