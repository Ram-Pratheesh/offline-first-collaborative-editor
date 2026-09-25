import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import * as Y from 'yjs';
import { ySyncPlugin, yUndoPlugin } from 'y-prosemirror';
import { Extension, type KeyboardShortcutCommand } from '@tiptap/core';
import { undo, redo } from 'y-prosemirror';
import { User as UserIcon, Wifi, WifiOff, Clock, Trash2 } from 'lucide-react';
import type { ObservationMeta } from '../../types';

interface ObservationCardProps {
  observation: ObservationMeta;
  ydoc: Y.Doc;
  currentUserId: string;
  isFinalized: boolean;
  onDelete?: (id: string) => void;
  onBlur?: (id: string) => void;
}

/**
 * Custom TipTap extension that wraps y-prosemirror plugins for
 * a specific Y.XmlFragment (one per observation).
 */
function createObservationYjsExtension(fragment: Y.XmlFragment) {
  return Extension.create({
    name: 'observationYjsSync',
    priority: 1000,

    addProseMirrorPlugins() {
      return [
        ySyncPlugin(fragment),
        yUndoPlugin(),
      ];
    },

    addKeyboardShortcuts() {
      return {
        'Mod-z': (() => undo(this.editor.state)) as unknown as KeyboardShortcutCommand,
        'Mod-y': (() => redo(this.editor.state)) as unknown as KeyboardShortcutCommand,
        'Shift-Mod-z': (() => redo(this.editor.state)) as unknown as KeyboardShortcutCommand,
      };
    },
  });
}

export const ObservationCard: React.FC<ObservationCardProps> = ({
  observation,
  ydoc,
  currentUserId,
  isFinalized,
  onDelete,
  onBlur,
}) => {
  const isOwn = observation.authorId === currentUserId;
  const fragmentKey = `obs-${observation.observationId}`;
  const fragment = useMemo(() => ydoc.getXmlFragment(fragmentKey), [ydoc, fragmentKey]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // @ts-ignore
          history: false,
        }),
        createObservationYjsExtension(fragment),
        Placeholder.configure({
          placeholder: isOwn
            ? 'Write your observation here...'
            : `${observation.authorName}'s observation`,
        }),
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      editable: isOwn && !isFinalized,
      editorProps: {
        attributes: {
          class: 'observation-editor focus:outline-none',
        },
      },
      immediatelyRender: false,
      onBlur: () => {
        if (onBlur) onBlur(observation.observationId);
      },
    },
    [fragment, isOwn, isFinalized, onBlur, observation.observationId]
  );

  const createdDate = new Date(observation.createdAt);
  const timeStr = createdDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = createdDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        border: isOwn ? '2px solid #e9d5ff' : '1px solid #e5e7eb',
        borderRadius: '16px',
        background: '#ffffff',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          background: isOwn ? '#faf5ff' : '#fafafa',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isOwn
              ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
              : 'linear-gradient(135deg, #93c5fd, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {observation.authorName.substring(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1f2937',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {observation.authorName}
            {isOwn && (
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#7c3aed', marginLeft: '6px' }}>
                (You)
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '2px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} />
              {dateStr} {timeStr}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 600,
                background: observation.connectivityState === 'online' ? '#ecfdf5' : '#fef3c7',
                color: observation.connectivityState === 'online' ? '#059669' : '#d97706',
              }}
            >
              {observation.connectivityState === 'online' ? (
                <Wifi size={9} />
              ) : (
                <WifiOff size={9} />
              )}
              {observation.connectivityState === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        {isOwn && !isFinalized && onDelete && (
          <button
            onClick={() => onDelete(observation.observationId)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
            title="Delete observation"
            onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Editor */}
      <div style={{ padding: '4px 0' }}>
        <style>{`
          .observation-editor {
            min-height: 60px;
            padding: 12px 16px;
            color: #1f2937;
            font-size: 15px;
            line-height: 1.7;
            outline: none;
          }
          .observation-editor p {
            margin: 0 0 8px;
          }
          .observation-editor p:last-child {
            margin-bottom: 0;
          }
          .observation-editor h1,
          .observation-editor h2,
          .observation-editor h3 {
            color: #1f2937;
          }
          .observation-editor .is-empty::before {
            color: #d1d5db;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
