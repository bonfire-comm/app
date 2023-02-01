import 'highlight.js/styles/github-dark.css';

import { RichTextEditor } from '@mantine/tiptap';
import { BubbleMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { KeyboardEventHandler, MutableRefObject, useEffect } from 'react';
import { noop } from 'lodash-es';
import { Editor } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import EnterHandler from '@/lib/tiptap/enterHandler';

import tsLanguageSyntax from 'highlight.js/lib/languages/typescript';
import jsLanguageSyntax from 'highlight.js/lib/languages/javascript';
import pyLanguageSyntax from 'highlight.js/lib/languages/python';
import shLanguageSyntax from 'highlight.js/lib/languages/bash';
import cppLanguageSyntax from 'highlight.js/lib/languages/cpp';
import csLanguageSyntax from 'highlight.js/lib/languages/csharp';
import cssLanguageSyntax from 'highlight.js/lib/languages/css';
import jsonLanguageSyntax from 'highlight.js/lib/languages/json';
import phpLanguageSyntax from 'highlight.js/lib/languages/php';
import arduinoLanguageSyntax from 'highlight.js/lib/languages/arduino';
import rustLanguageSyntax from 'highlight.js/lib/languages/rust';
import dockerLanguageSyntax from 'highlight.js/lib/languages/dockerfile';
import goLanguageSyntax from 'highlight.js/lib/languages/go';
import xmlLanguageSyntax from 'highlight.js/lib/languages/xml';
import dartLanguageSyntax from 'highlight.js/lib/languages/dart';

lowlight.registerLanguage('typescript', tsLanguageSyntax);
lowlight.registerLanguage('javascript', jsLanguageSyntax);
lowlight.registerLanguage('python', pyLanguageSyntax);
lowlight.registerLanguage('bash', shLanguageSyntax);
lowlight.registerLanguage('cpp', cppLanguageSyntax);
lowlight.registerLanguage('csharp', csLanguageSyntax);
lowlight.registerLanguage('css', cssLanguageSyntax);
lowlight.registerLanguage('html', xmlLanguageSyntax);
lowlight.registerLanguage('json', jsonLanguageSyntax);
lowlight.registerLanguage('php', phpLanguageSyntax);
lowlight.registerLanguage('arduino', arduinoLanguageSyntax);
lowlight.registerLanguage('rust', rustLanguageSyntax);
lowlight.registerLanguage('docker', dockerLanguageSyntax);
lowlight.registerLanguage('go', goLanguageSyntax);
lowlight.registerLanguage('dart', dartLanguageSyntax);

lowlight.registerAlias({
  'cpp': ['c++'],
  'csharp': ['c#', 'cs'],
  'docker': ['dockerfile'],
  'go': ['golang'],
  'html': ['xml'],
  'json': ['json5'],
  'rust': ['rs'],
  'typescript': ['ts', 'tsx', 'typescriptreact'],
  'javascript': ['js', 'jsx', 'javascriptreact'],
  'python': ['py'],
  'bash': ['sh'],
  'arduino': ['ino'],
});

export const lowlightInstance = lowlight;

interface Props {
  content: string;
  className?: string;
  placeholder?: string;
  clearOnSend?: boolean;
  editorRef?: MutableRefObject<Editor | null>;
  maxCharacters?: number;
  rightPadding?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (editor: Editor) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSend?: (content: string) => any;
}

export default function TextEditor({
  content,
  editorRef,
  clearOnSend = true,
  onChange = noop,
  className,
  placeholder,
  onSend = noop,
  maxCharacters,
  rightPadding = true
}: Props) {
  const editor = useEditor({
    extensions: [
      // OneLiner,
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        exitOnArrowDown: true
      }),
      EnterHandler,
      CharacterCount.configure({
        limit: maxCharacters,
      }),
      Link.configure({
        protocols: ['mailto'],
      })
    ],
    content,
    onUpdate({ editor: e }) {
      onChange(e);
    },
  });

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = async (ev) => {
    if (!editor) return;

    const { key, ctrlKey } = ev;

    // @ts-expect-error - I don't know why this is not working
    const cursor = editor.state.selection?.$cursor?.parent;

    if (key === 'Tab' && cursor && cursor.type?.name === 'codeBlock') {
      ev.preventDefault();

      return editor.chain().insertContent('  ').focus('end').run();
    }

    if (key === 'Enter' && ctrlKey) {
      ev.preventDefault();

      await onSend(editor.getHTML());

      if (clearOnSend) editor.commands.clearContent();
    }
  };

  return (
    <RichTextEditor
      editor={editor}
      withCodeHighlightStyles={false}
      withTypographyStyles={false}
      onKeyDown={onKeyDown}
      className={className}
      classNames={{
        root: 'rounded-xl',
        content: [
          'editor bg-cloudy-700 max-h-[400px] custom_scrollbar overflow-y-auto overflow-x-hidden rounded-lg',
          rightPadding && 'pr-28',
        ].filter(Boolean).join(' '),
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