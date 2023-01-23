export default function bigButtonClass(other?: string | null, disableColors = false) {
  return ['disabled:opacity-50 pointer-events-auto disabled:cursor-not-allowed rounded-xl font-extrabold text-lg h-auto py-4 transition-colors duration-200 ease-in-out', !disableColors && 'text-cloudy-600 bg-light-blue-500 hover:bg-light-blue-600',other].filter(Boolean).join(' ');
}