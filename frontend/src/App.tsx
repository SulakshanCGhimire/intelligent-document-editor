import { DocumentEditor } from './components/DocumentEditor'

function App() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Intelligent Document Editor
      </h1>
      <DocumentEditor />
    </div>
  );
}

export default App;