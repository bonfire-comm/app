export default async function download(url: string, name: string) {
  try {
    const response = await fetch(url);
    const data = await response.blob();
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(data);
    downloadLink.download = name;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}