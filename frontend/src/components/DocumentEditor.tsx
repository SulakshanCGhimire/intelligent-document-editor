import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export const DocumentEditor = () => {
  // Initialize the Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit, // Provides Paragraphs, Headings, Bold, Italic, etc.
    ],
    content: '<p>Start writing your document here...</p>',
    // We add a class here so we can style the editor area later
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none min-h-[500px] border p-4 rounded-md',
      },
    },
  })

  return (
    <div className="editor-wrapper">
      {/* 
        This is a temporary toolbar just to prove it works. 
        We will build a professional one later. 
      */}
      <div className="toolbar" style={{ marginBottom: '10px' }}>
        <button 
          onClick={() => editor?.chain().focus().toggleBold().run()}
          style={{ fontWeight: editor?.isActive('bold') ? 'bold' : 'normal' }}
        >
          Bold
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          style={{ fontWeight: editor?.isActive('italic') ? 'bold' : 'normal' }}
        >
          Italic
        </button>
      </div>

      {/* This component actually renders the editor instance on the screen */}
      <EditorContent editor={editor} />
    </div>
  )
}