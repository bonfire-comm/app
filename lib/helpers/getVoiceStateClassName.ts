export default function getVoiceStateClassName(state: MeetingState) {
  switch (state) {
    case 'DISCONNECTED':
      return 'text-red-500';
    case 'CONNECTING':
      return 'text-yellow-500';
    case 'CONNECTED':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}