import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

const EnterHandler = Extension.create({
  name: 'no_new_line',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('eventHandler'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Enter' && event.ctrlKey) {
              return true;
            }
          }
          // … and many, many more.
          // Here is the full list: https://prosemirror.net/docs/ref/#view.EditorProps
        },
      }),
    ];
  },
});

export default EnterHandler;