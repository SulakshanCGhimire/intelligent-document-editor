import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Type, Heading1, Heading2, Heading3 } from 'lucide-react'

export const DocumentEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: '<h1>Project Proposal</h1><p>Start writing your semantic document here...</p>',
    editorProps: {
      attributes: {
        class: 'tiptap', // Applies our new CSS
      },
    },
  })

  if (!editor) return null

  return (
    <div className="app-container">
      {/* PROFESSIONAL RIBBON TOOLBAR */}
      <div className="toolbar">
        
        {/* Group 1: Typography */}
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive('paragraph') ? 'active' : ''}
            title="Normal Text"
          >
            <Type size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>
        </div>

        {/* Group 2: Formatting */}
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic"
          >
            <Italic size={18} />
          </button>
        </div>

      </div>

      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}