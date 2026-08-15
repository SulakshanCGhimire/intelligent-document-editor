import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

// Added new Lucide icons for lists and tables
import { 
  Bold, Italic, Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, 
  Moon, Sun, List, ListOrdered, Table as TableIcon, 
  BetweenHorizontalStart, BetweenVerticalStart, Trash2
} from 'lucide-react'

export const DocumentEditor = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      // Register Table Extensions
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<h1>Project Proposal</h1><p>Start writing your semantic document here...</p>',
    editorProps: {
      attributes: {
        class: 'tiptap', 
      },
    },
  })

  if (!editor) return null

  return (
    <div className={`app-container theme-${theme}`}>
      <div className="toolbar">
        
        {/* Group 1: Typography */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'active' : ''} title="Normal Text"><Type size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''} title="Heading 1"><Heading1 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''} title="Heading 2"><Heading2 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'active' : ''} title="Heading 3"><Heading3 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={editor.isActive('heading', { level: 4 }) ? 'active' : ''} title="Heading 4"><Heading4 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} className={editor.isActive('heading', { level: 5 }) ? 'active' : ''} title="Heading 5"><Heading5 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} className={editor.isActive('heading', { level: 6 }) ? 'active' : ''} title="Heading 6"><Heading6 size={18} /></button>
        </div>

        {/* Group 2: Formatting */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''} title="Bold"><Bold size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''} title="Italic"><Italic size={18} /></button>
        </div>

        {/* NEW - Group 3: Lists */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} title="Bullet List"><List size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} title="Numbered List"><ListOrdered size={18} /></button>
        </div>

        {/* Group 4: Tables */}
        <div className="toolbar-group">
          <button 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
            title="Insert 3x3 Table"
          >
            <TableIcon size={18} />
          </button>
          <button 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => editor.chain().focus().addColumnAfter().run()} 
            disabled={!editor.can().addColumnAfter()} 
            title="Add Column"
          >
            <BetweenVerticalStart size={18} />
          </button>
          <button 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => editor.chain().focus().addRowAfter().run()} 
            disabled={!editor.can().addRowAfter()} 
            title="Add Row"
          >
            <BetweenHorizontalStart size={18} />
          </button>
          <button 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => editor.chain().focus().deleteTable().run()} 
            disabled={!editor.can().deleteTable()} 
            title="Delete Table" 
            style={{ color: editor.can().deleteTable() ? '#ef4444' : 'inherit' }}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none' }}>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

      </div>

      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}