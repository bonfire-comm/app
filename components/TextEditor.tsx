import { RichTextEditor } from '@mantine/tiptap';
import { BubbleMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import OneLiner from '@/lib/tiptap/oneLine';
import { KeyboardEventHandler } from 'react';
import { noop } from 'lodash-es';
import { Editor } from '@tiptap/core';

interface Props {
  content: string;
  className?: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (editor: Editor) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEnter?: (editor: Editor) => any;
}

export default function TextEditor({ content, onChange = noop, className, placeholder, onEnter = noop }: Props) {
  const editor = useEditor({
    extensions: [
      OneLiner,
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate({ editor: e }) {
      onChange(e);
    },
  });

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = ({ key, shiftKey }) => {
    if (!editor) return;

    if (key === 'Enter' && !shiftKey) onEnter(editor);
  };

  return (
    <RichTextEditor
      editor={editor}
      onKeyDown={onKeyDown}
      className={className}
      classNames={{
        root: 'rounded-lg',
        content: 'bg-cloudy-700 max-h-40 overflow-y-auto overflow-x-hidden rounded-lg',
      }}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
        >
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Link />
          </RichTextEditor.ControlsGroup>
        </BubbleMenu>
      )}

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}