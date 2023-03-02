import { openModal } from '@mantine/modals';
import { useAsync } from 'react-use';
import { useLocalStorage } from '@mantine/hooks';
import { Select } from '@mantine/core';
import useVoice from '../store/voice';

const MicInput = ({ className }: { className?: string }) => {
  // eslint-disable-next-line no-shadow
  const meeting = useVoice(({ meeting }) => meeting);

  const [mic, setMic] = useLocalStorage({
    key: 'mic',
    defaultValue: 'default'
  });

  const allMics = useAsync(async () => meeting?.getMics(), [meeting]);
  const currentMic = useAsync(async () => {
    const mics = allMics.value;
    if (!mics) return null;
    if (!mics.some((s) => s.deviceId === mic)) return 'default';

    return mic;
  }, [allMics, mic]);

  const changeMic = (value: string | null) => {
    if (!value) return;

    setMic(value);
    meeting?.changeMic(value);
  };

  return (
    <Select
      label="Microphone"
      data={allMics.value?.map((s) => ({ label: s.label, value: s.deviceId })) ?? []}
      value={currentMic.value}
      onChange={changeMic}
      className={className}
    />
  );
};

const CamInput = ({ className }: { className?: string }) => {
  // eslint-disable-next-line no-shadow
  const meeting = useVoice(({ meeting }) => meeting);

  const [cam, setCam] = useLocalStorage({
    key: 'cam',
    defaultValue: 'default'
  });

  const allCams = useAsync(async () => meeting?.getWebcams(), [meeting]);
  const currentCam = useAsync(async () => {
    const mics = allCams.value;
    if (!mics) return null;
    if (!mics.some((s) => s.deviceId === cam)) return 'default';

    return cam;
  }, [allCams, cam]);

  const changeCam = (value: string | null) => {
    if (!value) return;

    setCam(value);
    meeting?.changeWebcam(value);
  };

  return (
    <Select
      label="Webcam"
      data={allCams.value?.map((s) => ({ label: s.label, value: s.deviceId })) ?? []}
      value={currentCam.value}
      onChange={changeCam}
      className={className}
    />
  );
};

const SettingModalContent = () => (
  <section>
    <h2 className="font-bold text-lg mb-2">Media Device</h2>
    <MicInput className="mb-2" />
    <CamInput />
  </section>
);

export default function openSettingsModal() {
  openModal({
    title: 'Settings',
    children: <SettingModalContent />,
    size: 'lg',
    centered: true
  });
}