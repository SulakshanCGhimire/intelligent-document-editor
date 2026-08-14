import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export const DocumentEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3], // Explicitly allow H1, H2, H3
        },
      }),
    ],
    content: '<h1>Document Title</h1><p>Start writing here...</p>',
  })

  if (!editor) return null

  return (
    <div className="app-container">
      {/* PROFESSIONAL TOOLBAR */}
      <div className="toolbar">
        <button 
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'active' : ''}
        >
          Normal Text
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
        >
          H1
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        >
          H2
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
        >
          Bold
        </button>
      </div>

      {/* EDITOR CANVAS */}
      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}