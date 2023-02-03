import { ReactNode } from 'react';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { Menu } from '@mantine/core';

const useMenu = create(
  combine({
    showContextMenu: false,
    contextMenuPosition: [0, 0],
    contextMenuItems: null as ReactNode | null,
  }, (set) => ({
    setShowContextMenu: (showContextMenu: boolean) => set({ showContextMenu }),
    setContextMenuPosition: (contextMenuPosition: [number, number]) => set({ contextMenuPosition }),
    setContextMenuItems: (contextMenuItems: ((component: typeof Menu) => ReactNode) | ReactNode | null) => {
      set({ contextMenuItems: typeof contextMenuItems === 'function' ? contextMenuItems(Menu) : contextMenuItems });
    },
    openContextMenu: (contextMenuPosition: [number, number], contextMenuItems: ReactNode | null) => set({
      showContextMenu: true,
      contextMenuPosition,
      contextMenuItems
    }),
  }))
);

export default useMenu;