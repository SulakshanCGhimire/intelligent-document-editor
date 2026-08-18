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
import mammoth from 'mammoth'
import { Document, Packer, Paragraph as DocxParagraph, TextRun } from 'docx'
import { CommentMark } from '../extensions/CommentMark'

import {
  Bold, Italic, Underline as UnderlineIcon, Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Moon, Sun, List, ListOrdered, Table as TableIcon, Trash2,
  FileText, Download, Printer, MoveVertical, Plus, Minus, MessageSquare, Send, CheckCircle2, Quote
} from 'lucide-react'

const WS_URL = import.meta.env.VITE_YJS_WS_URL ?? 'wss://demos.yjs.dev/ws'
const ROOM_NAME = 'intelligent-doc-editor-room-alpha'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider(WS_URL, ROOM_NAME, ydoc)
const persistence = new IndexeddbPersistence(ROOM_NAME, ydoc)

persistence.on('synced', () => {
  console.log('Content successfully loaded from local IndexedDB cache!')
})

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

interface CommentThread {
  id: string
  text: string
  quotedText: string
  author: string
  resolved: boolean
  createdAt: string
}

interface DocumentEditorProps {
  userName?: string
  userColor?: string
}

export const DocumentEditor = ({
  userName = 'Sulakshan',
  userColor = '#10b981',
}: DocumentEditorProps) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [collaborators, setCollaborators] = useState<Array<{ name: string; color: string; clientId: number }>>([])
  
  // File menu & Spacing menu states
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [spacingMenuOpen, setSpacingMenuOpen] = useState(false)
  const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false)
  const [comments, setComments] = useState<CommentThread[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [lineCommentActive, setLineCommentActive] = useState(false)

  const fileMenuRef = useRef<HTMLDivElement>(null)
  const spacingMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExportDocx = async () => {
    if (!editor) return
    const textContent = editor.getText()
    const lines = textContent.split('\n')
    const docxParagraphs = lines.map(line => 
      new DocxParagraph({
        children: [
          new TextRun({
            text: line || '',
            size: 24,
          }),
        ],
      })
    )

    const doc = new Document({
      sections: [{ properties: {}, children: docxParagraphs }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document.docx'
    link.click()
    URL.revokeObjectURL(url)
    setFileMenuOpen(false)
  }

  const handlePrintPdf = () => {
    window.print()
    setFileMenuOpen(false)
  }

  const handleTriggerImport = () => {
    fileInputRef.current?.click()
    setFileMenuOpen(false)
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    const fileName = file.name.toLowerCase()

    try {
      if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = await file.text()
        const formattedHtml = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .split('\n')
          .map(line => `<p>${line || '<br/>'}</p>`)
          .join('')
        editor.commands.setContent(formattedHtml)
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        editor.commands.setContent(result.value)
      } else {
        alert('Please upload a .txt, .md, or .docx file.')
      }
    } catch (error) {
      console.error('Error importing file:', error)
      alert('Failed to parse and import the file.')
    }

    event.target.value = ''
  }

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

  // Add Comment (for selected text or current paragraph/line)
  const handleAddComment = (targetLineOnly = false) => {
    if (!editor) return

    if (targetLineOnly) {
      editor.chain().focus().selectParentNode().run()
    }

    const { from, to } = editor.state.selection
    if (from === to) {
      alert('Please click on a paragraph or select text to attach a comment.')
      return
    }

    const quotedText = editor.state.doc.textBetween(from, to, ' ')
    const commentText = prompt('Enter your comment for this section:')
    if (!commentText || !commentText.trim()) return

    const commentId = 'comment_' + Math.random().toString(36).substring(2, 9)
    editor.chain().focus().setComment(commentId).run()

    const newThread: CommentThread = {
      id: commentId,
      text: commentText.trim(),
      quotedText: quotedText.length > 60 ? quotedText.substring(0, 60) + '...' : quotedText,
      author: userName,
      resolved: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setComments([newThread, ...comments])
    setCommentsSidebarOpen(true)
    setLineCommentActive(false)
  }

  const handleResolveComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, resolved: true } : c))
  }

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
        // @ts-ignore
        history: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        paragraph: false,
      }),
      CustomParagraph,
      Underline,
      CommentMark,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({ provider: provider, user: { name: userName, color: userColor } }),
    ],
    editorProps: {
      attributes: { class: 'tiptap' },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const isCollapsed = from === to
      const isInBlock = editor.isActive('paragraph') || editor.isActive('heading')
      setLineCommentActive(isCollapsed && isInBlock)
    },
  })

  useEffect(() => {
    return () => { editor?.destroy() }
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".md,.txt,.docx"
        style={{ display: 'none' }}
      />

      <div className="toolbar">
        {/* File Menu */}
        <div className="toolbar-group" ref={fileMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setFileMenuOpen(!fileMenuOpen)} onMouseDown={(e) => e.preventDefault()} style={{ fontWeight: 600, padding: '6px 12px', gap: 6 }}>
            <FileText size={16} /> File
          </button>
          {fileMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '190px', background: 'var(--bg-toolbar)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '4px' }}>
              <button onClick={handleTriggerImport} onMouseDown={(e) => e.preventDefault()} style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}>
                <FileText size={14} /> Import File (.md/.txt/.docx)
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <button onClick={handleExportDocx} onMouseDown={(e) => e.preventDefault()} style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}>
                <Download size={14} /> Export Word (.docx)
              </button>
              <button onClick={handleExportMarkdown} onMouseDown={(e) => e.preventDefault()} style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}>
                <Download size={14} /> Export Markdown
              </button>
              <button onClick={handlePrintPdf} onMouseDown={(e) => e.preventDefault()} style={{ justifyContent: 'flex-start', gap: 8, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '8px 10px', borderRadius: '4px' }}>
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'active' : ''}><Type size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}><Heading1 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}><Heading2 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}><Heading3 size={18} /></button>
        </div>

        {/* Formatting */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}><UnderlineIcon size={18} /></button>
        </div>

        {/* Spacing */}
        <div className="toolbar-group" ref={spacingMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setSpacingMenuOpen(!spacingMenuOpen)} onMouseDown={(e) => e.preventDefault()} style={{ fontWeight: 600, padding: '6px 10px', gap: 6 }}>
            <MoveVertical size={16} /> Spacing
          </button>
          {spacingMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '210px', background: 'var(--bg-toolbar)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '6px', gap: '2px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px' }}>Line Spacing</div>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.0')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>Single (1.0)</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.15')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>1.15</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('1.5')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>1.5 (Standard)</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleLineHeight('2.0')} style={{ justifyContent: 'flex-start', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>Double (2.0)</button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceBefore('18px')} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', fontSize: '13px' }}><Plus size={12} /> Add space before</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceBefore(null)} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-muted)', padding: '6px 10px', fontSize: '13px' }}><Minus size={12} /> Remove space before</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceAfter('24px')} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-main)', padding: '6px 10px', fontSize: '13px' }}><Plus size={12} /> Add space after</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSpaceAfter(null)} style={{ justifyContent: 'flex-start', gap: 6, width: '100%', border: 'none', background: 'transparent', color: 'var(--text-muted)', padding: '6px 10px', fontSize: '13px' }}><Minus size={12} /> Remove space after</button>
            </div>
          )}
        </div>

        {/* Lists & Tables */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}><List size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''}><ListOrdered size={18} /></button>
        </div>

        <div className="toolbar-group">
          <button onMouseDown={(e) => e.preventDefault()} onClick={handleInsertTable}><TableIcon size={18} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={handleAddColumn} style={{ fontSize: '13px', fontWeight: '600' }}>+ Col</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>- Col</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={handleAddRow} style={{ fontSize: '13px', fontWeight: '600', marginLeft: '8px' }}>+ Row</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>- Row</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} style={{ color: '#ef4444', marginLeft: '8px' }}><Trash2 size={18} /></button>
        </div>

        {/* Comments Toggle */}
        <div className="toolbar-group">
          <button onClick={() => setCommentsSidebarOpen(!commentsSidebarOpen)} style={{ fontWeight: 600, padding: '6px 10px', gap: 6 }}>
            <MessageSquare size={16} /> Comments ({comments.filter(c => !c.resolved).length})
          </button>
        </div>

        {/* Avatars */}
        <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
          {collaborators.map((user, index) => (
            <div key={user.clientId} title={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: user.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', border: '2px solid var(--toolbar-bg, #1e293b)', marginLeft: index === 0 ? '0' : '-8px', zIndex: collaborators.length - index }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Theme & Status */}
        <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none', alignItems: 'center', gap: 6 }}>
          <span title={`Sync: ${status}`} style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'connected' ? '#22c55e' : status === 'connecting' ? '#eab308' : '#ef4444', display: 'inline-block' }} />
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </div>

      {/* Main Container with Editor and Comment Sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="editor-wrapper" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <EditorContent editor={editor} />

          {/* Quick Line Comment Action Button */}
          {lineCommentActive && (
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                handleAddComment(true)
              }}
              style={{
                position: 'absolute',
                right: '40px',
                marginTop: '-32px',
                background: 'var(--bg-toolbar)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                zIndex: 10,
              }}
              title="Add comment on this paragraph/line"
            >
              <MessageSquare size={14} color="#10b981" /> Comment on line
            </button>
          )}
        </div>

        {commentsSidebarOpen && (
          <div style={{ width: '320px', background: 'var(--bg-toolbar)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', zIndex: 50, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Document Comments</h3>
              <button onClick={() => setCommentsSidebarOpen(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '40px' }}>
                  No comments yet.<br/>Select text or click "Comment on line".
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', opacity: c.resolved ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{c.author}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.createdAt}</span>
                    </div>

                    {/* Quoted text snippet indicator */}
                    {c.quotedText && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(234, 179, 8, 0.1)', borderLeft: '3px solid #eab308', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        <Quote size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>"{c.quotedText}"</span>
                      </div>
                    )}

                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>{c.text}</p>
                    
                    {!c.resolved && (
                      <button onClick={() => handleResolveComment(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <CheckCircle2 size={12} /> Resolve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-toolbar)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add comment on selection..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(false)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
              />
              <button onClick={() => handleAddComment(false)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}