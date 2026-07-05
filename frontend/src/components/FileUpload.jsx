import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUpload = ({ onFileContent, languageMap }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    
    // Map file extension to monaco language string
    const map = {
      'java': 'java',
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp'
    };

    const lang = map[extension];

    if (!lang) {
      alert(`Unsupported file type: .${extension}. Supported: .java, .py, .js, .ts, .c, .cpp, .cs`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onFileContent(e.target.result, lang);
    };
    reader.readAsText(file);
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept=".java,.py,.js,.ts,.c,.cpp,.cs" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current.click()} 
        className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 rounded-lg transition text-sm font-medium shadow-sm"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload File
      </button>
    </>
  );
};

export default FileUpload;
