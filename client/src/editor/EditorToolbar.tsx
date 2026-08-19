import React from 'react';
import type { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough, Code, Quote,
  List, ListOrdered, CheckSquare, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2,
  Table as TableIcon, Image as ImageIcon, Minus, Highlighter,
  Type,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      rounded-lg transition-all duration-150 cursor-pointer
      ${isActive
        ? 'bg-[#ffffff] text-[#171432] shadow-sm'
        : 'text-[#d6d3df] hover:text-[#ffffff] hover:bg-white/10'
      }
      disabled:opacity-30 disabled:cursor-not-allowed
    `}
    style={{ padding: '0.5rem' }}
  >
    {children}
  </button>
);

const Divider = () => <div className="bg-border-default mx-1.5" style={{ width: '1px', height: '1.75rem' }} />;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="editor-toolbar-wrap flex items-center gap-1 flex-nowrap rounded-xl border border-border-subtle bg-bg-secondary/60"
      style={{ padding: '0.375rem 0.75rem' }}
    >
      {/* Text Style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <Underline className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
        <Highlighter className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
        <Code className="w-5 h-5" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph">
        <Type className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 className="w-5 h-5" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        <List className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
        <ListOrdered className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist">
        <CheckSquare className="w-5 h-5" />
      </ToolbarButton>

      <Divider />

      {/* Blocks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
        <Quote className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
        <Code className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert Table"
      >
        <TableIcon className="w-5 h-5" />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight className="w-5 h-5" />
      </ToolbarButton>

      <Divider />

      {/* Undo/Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <Undo2 className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
        <Redo2 className="w-5 h-5" />
      </ToolbarButton>
    </motion.div>
  );
};

