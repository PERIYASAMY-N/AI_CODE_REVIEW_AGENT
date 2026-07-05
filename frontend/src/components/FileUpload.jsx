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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-md transition text-xs font-medium"
        title="Upload a source file"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload
      </button>
    </>
  );
};

export default FileUpload;
