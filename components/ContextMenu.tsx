import { Menu } from '@mantine/core';
import { shallow } from 'zustand/shallow';
import { useClipboard, useWindowEvent } from '@mantine/hooks';
import { useState } from 'react';
import useMenu from '@/lib/store/menu';
import openNewTab from '@/lib/helpers/openNewTab';

export default function ContextMenu() {
  const width = 240;

  const [show, position, items] = useMenu((s) => [s.showContextMenu, s.contextMenuPosition, s.contextMenuItems], shallow);
  const [setPosition, setShow, setItems] = useMenu((s) => [s.setContextMenuPosition, s.setShowContextMenu, s.setContextMenuItems], shallow);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const clipboard = useClipboard({ timeout: 2000 });
  const close = () => {
    setShow(false);
    setItems(null);
  };

  useWindowEvent('blur', close);
  useWindowEvent('click', close);
  useWindowEvent('contextmenu', (ev) => {
    ev.preventDefault();

    const { target } = ev;
    if (target && ((target as HTMLAnchorElement).href || (target as HTMLImageElement).src)) {
      setMediaUrl((target as HTMLAnchorElement).href || (target as HTMLImageElement).src);
    } else {
      setMediaUrl(null);
    }

    setItems(null);
    setPosition([ev.clientX, ev.clientY + 20]);
    setShow(true);
  });

  return (
    <Menu
      withArrow
      position="bottom"
      arrowSize={9}
      zIndex={301}
      onClose={close}
      onChange={(opened) => setShow(opened)}
      transitionDuration={0}
      width={width}
      opened={show && (!!items || !!mediaUrl)}
      styles={{
        dropdown: {
          transform: `translate3d(${position[0] - width / 2}px, ${
            position[1]
          }px, 0)`,
        },
      }}
      classNames={{
        dropdown: 'fixed',
        arrow: 'left-1/2 -translate-x-1/2 rotate-45',
      }}
    >
      <Menu.Dropdown className="dark:bg-cloudy-600">
        {items}

        {mediaUrl && (
          <>
            {items && (
              <Menu.Divider />

            )}

            <Menu.Item onClick={() => clipboard.copy(mediaUrl)}>Copy Link</Menu.Item>
            <Menu.Item onClick={() => openNewTab(mediaUrl)}>Open Link</Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}