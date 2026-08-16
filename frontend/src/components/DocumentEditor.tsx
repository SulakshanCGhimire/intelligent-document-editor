import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'

import {
  Bold, Italic, Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Moon, Sun, List, ListOrdered, Table as TableIcon, Trash2
} from 'lucide-react'

const WS_URL = import.meta.env.VITE_YJS_WS_URL ?? 'wss://demos.yjs.dev/ws'
const ROOM_NAME = 'intelligent-doc-editor-room-alpha'

// GLOBAL INITIALIZATION: Protects against React 18 Strict Mode double-invoke bugs
const ydoc = new Y.Doc()
const provider = new WebsocketProvider(WS_URL, ROOM_NAME, ydoc)

interface DocumentEditorProps {
  userName?: string
  userColor?: string
}

export const DocumentEditor = ({
  userName = 'Sulakshan',
  userColor = '#10b981', // Soft Emerald
}: DocumentEditorProps) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [collaborators, setCollaborators] = useState<Array<{ name: string; color: string; clientId: number }>>([])

  // Track online peers via Yjs Awareness for the Google-style avatar stack
  useEffect(() => {
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().entries())
      const users = states.map(([clientId, state]: [number, any]) => ({
        clientId,
        name: state.user?.name || 'Anonymous',
        color: state.user?.color || '#0ea5e9',
      }))
      setCollaborators(users)
    }

    provider.awareness.on('change', updateUsers)
    updateUsers()

    const handleStatus = ({ status: s }: { status: 'connecting' | 'connected' | 'disconnected' }) => setStatus(s)
    provider.on('status', handleStatus)

    return () => {
      provider.awareness.off('change', updateUsers)
      provider.off('status', handleStatus)
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // @ts-ignore - Safely bypasses TS mismatch to prevent Prosemirror/Yjs history collisions
        history: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: { name: userName, color: userColor },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) return null

  const handleInsertTable = () => {
    const rows = parseInt(window.prompt('Enter number of rows:', '3') || '0', 10)
    const cols = parseInt(window.prompt('Enter number of columns:', '3') || '0', 10)

    if (rows > 0 && cols > 0) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run()
    }
  }

  const handleAddColumn = () => {
    const pos = window.prompt('Type "L" to add Left, or "R" to add Right:', 'R')
    if (pos?.toUpperCase() === 'L') editor.chain().focus().addColumnBefore().run()
    if (pos?.toUpperCase() === 'R') editor.chain().focus().addColumnAfter().run()
  }

  const handleAddRow = () => {
    const pos = window.prompt('Type "U" to add Up, or "D" to add Down:', 'D')
    if (pos?.toUpperCase() === 'U') editor.chain().focus().addRowBefore().run()
    if (pos?.toUpperCase() === 'D') editor.chain().focus().addRowAfter().run()
  }

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

        {/* Group 3: Lists */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} title="Bullet List"><List size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} title="Numbered List"><ListOrdered size={18} /></button>
        </div>

        {/* Group 4: Tables */}
        <div className="toolbar-group">
          <button onMouseDown={(e) => e.preventDefault()} onClick={handleInsertTable} title="Insert Custom Table">
            <TableIcon size={18} />
          </button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={handleAddColumn} title="Add Column" style={{ fontSize: '13px', fontWeight: '600' }}>
            + Col
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>
            - Col
          </button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={handleAddRow} title="Add Row" style={{ fontSize: '13px', fontWeight: '600', marginLeft: '8px' }}>
            + Row
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>
            - Row
          </button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table" style={{ color: '#ef4444', marginLeft: '8px' }}>
            <Trash2 size={18} />
          </button>
        </div>

        {/* Google Docs-Style Active Collaborator Avatars */}
        <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
          {collaborators.map((user, index) => (
            <div
              key={user.clientId}
              title={user.name}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: user.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                border: '2px solid var(--toolbar-bg, #1e293b)',
                marginLeft: index === 0 ? '0' : '-8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                userSelect: 'none',
                zIndex: collaborators.length - index,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Connection Status & Theme Toggle */}
        <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none', alignItems: 'center', gap: 6 }}>
          <span
            title={`Sync: ${status}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: status === 'connected' ? '#22c55e' : status === 'connecting' ? '#eab308' : '#ef4444',
              display: 'inline-block',
            }}
          />
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