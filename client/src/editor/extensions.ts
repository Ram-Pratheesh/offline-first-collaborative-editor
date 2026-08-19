import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import type { Extensions } from '@tiptap/react';
import * as Y from 'yjs';
import { ySyncPlugin, yUndoPlugin, yCursorPlugin, undo, redo } from 'y-prosemirror';
import { Extension, type KeyboardShortcutCommand } from '@tiptap/core';
import type { Awareness } from 'y-protocols/awareness';

const CURSOR_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80',
  '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
  '#e879f9', '#34d399', '#fbbf24', '#38bdf8',
];

export function getCursorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

/**
 * Custom TipTap extension that wraps y-prosemirror's ySyncPlugin and yUndoPlugin
 * directly, bypassing @tiptap/extension-collaboration entirely.
 * This avoids the dual prosemirror-model instance problem that causes
 * "Schema is missing its top node type ('doc')".
 */
const YjsCollaboration = Extension.create({
  name: 'yjsCollaboration',
  priority: 1000,

  addOptions() {
    return {
      document: null as Y.Doc | null,
      field: 'default',
      awareness: null as Awareness | null,
    };
  },

  addProseMirrorPlugins() {
    const ydoc = this.options.document as Y.Doc;
    const fragment = ydoc.getXmlFragment(this.options.field);
    const awareness = this.options.awareness as Awareness | null;

    const plugins = [
      ySyncPlugin(fragment),
      yUndoPlugin(),
    ];

    // Add cursor plugin if awareness is available
    if (awareness) {
      plugins.push(
        yCursorPlugin(awareness)
      );
    }

    return plugins;
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': (() => undo(this.editor.state)) as unknown as KeyboardShortcutCommand,
      'Mod-y': (() => redo(this.editor.state)) as unknown as KeyboardShortcutCommand,
      'Shift-Mod-z': (() => redo(this.editor.state)) as unknown as KeyboardShortcutCommand,
    };
  },
});

export function createExtensions(ydoc: Y.Doc, awareness?: Awareness): Extensions {
  return [
    StarterKit.configure({
      // @ts-ignore - Tiptap v2/v3 typings mismatch, but 'history' is required to disable the default undo manager
      history: false,
    }),
    YjsCollaboration.configure({
      document: ydoc,
      awareness: awareness || null,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({
      inline: true,
    }),
    Placeholder.configure({
      placeholder: 'Start writing something amazing...',
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
  ];
}

/**
 * Fallback extensions used before Yjs is initialized.
 * Provides a valid schema with Document/Paragraph/Text nodes so
 * useEditor never encounters an empty schema.
 */
export function createFallbackExtensions(): Extensions {
  return [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Loading document...',
    }),
  ];
}

