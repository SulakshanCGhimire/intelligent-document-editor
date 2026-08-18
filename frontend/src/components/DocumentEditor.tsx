import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Paragraph from '@tiptap/extension-paragraph'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'

import {
  Bold, Italic, Underline as UnderlineIcon, Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Moon, Sun, List, ListOrdered, Table as TableIcon, Trash2,
  FileText, Download, Printer, MoveVertical, Plus, Minus
} from 'lucide-react'

const WS_URL = import.meta.env.VITE_YJS_WS_URL ?? 'wss://demos.yjs.dev/ws'
const ROOM_NAME = 'intelligent-doc-editor-room-alpha'

// GLOBAL INITIALIZATION: Protects against React 18 Strict Mode double-invoke bugs
const ydoc = new Y.Doc()
const provider = new WebsocketProvider(WS_URL, ROOM_NAME, ydoc)

// PERSISTENCE: Caches doc state locally in IndexedDB
const persistence = new IndexeddbPersistence(ROOM_NAME, ydoc)

persistence.on('synced', () => {
  console.log('Content successfully loaded from local IndexedDB cache!')
})

// CUSTOM PARAGRAPH EXTENSION: Natively supports line-height & paragraph spacing in Tiptap & Yjs
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: element => element.style.lineHeight || null,
        renderHTML: attributes => {
          if (!attributes.lineHeight) return {}
          return { style: `line-height: ${attributes.lineHeight};` }
        },
      },
      spaceBefore: {
        default: null,
        parseHTML: element => element.style.marginTop || null,
        renderHTML: attributes => {
          if (!attributes.spaceBefore) return {}
          return { style: `margin-top: ${attributes.spaceBefore};` }
        },
      },
      spaceAfter: {
        default: null,
        parseHTML: element => element.style.marginBottom || null,
        renderHTML: attributes => {
          if (!attributes.spaceAfter) return {}
          return { style: `margin-bottom: ${attributes.spaceAfter};` }
        },
      },
    }
  },
})

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
  
  // File menu & Spacing menu states & references
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [spacingMenuOpen, setSpacingMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const spacingMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setFileMenuOpen(false)
      }
      if (spacingMenuRef.current && !spacingMenuRef.current.contains(event.target as Node)) {
        setSpacingMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Export as Markdown
  const handleExportMarkdown = () => {
    if (!editor) return
    const textContent = editor.getText()
    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document.md'
    link.click()
    URL.revokeObjectURL(url)
    setFileMenuOpen(false)
  }

  // Print / Save PDF via Browser
  const handlePrintPdf = () => {
    window.print()
    setFileMenuOpen(false)
  }

  // Spacing helper handlers
  const handleLineHeight = (value: string) => {
    if (!editor) return
    editor.chain().focus().updateAttributes('paragraph', { lineHeight: value }).run()
    setSpacingMenuOpen(false)
  }

  const handleSpaceBefore = (value: string | null) => {
    if (!editor) return
    editor.chain().focus().updateAttributes('paragraph', { spaceBefore: value }).run()
    setSpacingMenuOpen(false)
  }

  const handleSpaceAfter = (value: string | null) => {
    if (!editor) return
    editor.chain().focus().updateAttributes('paragraph', { spaceAfter: value }).run()
    setSpacingMenuOpen(false)
  }

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
        paragraph: false, // Replaced by CustomParagraph
      }),
      CustomParagraph,
      Underline,
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

        {/* Group 0: File Menu (Google Docs Style) */}
        <div className="toolbar-group" ref={fileMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            onMouseDown={(e) => e.preventDefault()}
            style={{ fontWeight: 600, padding: '6px 12px', gap: 6 }}
            title="File Menu"
          >
            <FileText size={16} /> File
          </button>

          {fileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '180px',
                background: 'var(--bg-toolbar)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                padding: '4px',
              }}
            >
              <button
                onClick={handleExportMarkdown}
                onMouseDown={(e) => e.preventDefault()}
                style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}
              >
                <Download size={14} /> Export Markdown
              </button>
              <button
                onClick={handlePrintPdf}
                onMouseDown={(e) => e.preventDefault()}
                style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>
          )}
        </div>

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
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''} title="Underline (Ctrl+U)"><UnderlineIcon size={18} /></button>
        </div>

        {/* Group 3: Line & Paragraph Spacing Dropdown */}
        <div className="toolbar-group" ref={spacingMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSpacingMenuOpen(!spacingMenuOpen)}
            onMouseDown={(e) => e.preventDefault()}
            style={{ fontWeight: 600, padding: '6px 10px', gap: 6 }}
            title="Line & Paragraph Spacing"
          >
            <MoveVertical size={16} /> Spacing
          </button>

          {spacingMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '210px',
                background: 'var(--bg-toolbar)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                padding: '6px',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>Line Spacing</div>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.0')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>Single (1.0)</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.15')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>1.15</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.5')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>1.5 (Standard)</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('2.0')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>Double (2.0)</button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>Paragraph Spacing</div>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceBefore('18px')} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>
                <Plus size={12} /> Add space before
              </button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceBefore(null)} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>
                <Minus size={12} /> Remove space before
              </button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceAfter('24px')} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>
                <Plus size={12} /> Add space after
              </button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceAfter(null)} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>
                <Minus size={12} /> Remove space after
              </button>
            </div>
          )}
        </div>

        {/* Group 4: Lists */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} title="Bullet List"><List size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} title="Numbered List"><ListOrdered size={18} /></button>
        </div>

        {/* Group 5: Tables */}
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