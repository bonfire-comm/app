/* eslint-disable @next/next/no-img-element */
import { openConfirmModal } from '@mantine/modals';
import Router from 'next/router';
import Channel from '../classes/channel';

export default async function openLeaveGroupModal(channel: Channel) {
  openConfirmModal({
    centered: true,
    title: 'Are you sure?',
    children: <p>You need to be added again or use the invite link to join again.</p>,
    closeOnConfirm: true,
    labels: {
      confirm: 'Leave',
      cancel: 'Cancel'
    },
    confirmProps: {
      color: 'red'
    },
    cancelProps: {
      color: 'gray'
    },
    onConfirm: async () => {
      channel.stopListenMessages();

      await channel.leave();

      channel.clean();
      Router.push('/app');
    },
    zIndex: 1000000000
  });
}