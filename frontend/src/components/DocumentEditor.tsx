import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Moon, Sun } from 'lucide-react'

export const DocumentEditor = () => {
  // State to manage the theme. Defaults to dark.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
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
    // Apply the theme class to the root container dynamically
    <div className={`app-container theme-${theme}`}>
      <div className="toolbar">
        
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
          <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive('heading', { level: 4 }) ? 'active' : ''}
        title="Heading 4"
      >
        <Heading4 size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        className={editor.isActive('heading', { level: 5 }) ? 'active' : ''}
        title="Heading 5"
      >
        <Heading5 size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        className={editor.isActive('heading', { level: 6 }) ? 'active' : ''}
        title="Heading 6"
      >
        <Heading6 size={18} />
      </button>
        </div>

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

        {/* Theme Toggle Button - Pushed to the far right */}
        <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none' }}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
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