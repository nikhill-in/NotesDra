import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { User, ConversionHistory } from '../types';
import { 
  FileUp, ArrowRightLeft, FileCode, Check, Eye, HelpCircle, 
  Download, History, Trash, FileText, Image, Scroll, AlertCircle, RefreshCw 
} from 'lucide-react';

interface ConverterViewProps {
  user: User | null;
}

const SUPPORTED_IMGS = ['PNG', 'JPG', 'WebP', 'BMP', 'GIF'];
const SUPPORTED_DOCS = ['TXT', 'Markdown', 'HTML', 'JSON', 'CSV', 'XML', 'YAML'];

export default function ConverterView({ user }: ConverterViewProps) {
  // Config parameters
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileTextContent, setFileTextContent] = useState<string>('');
  
  const [originalFormat, setOriginalFormat] = useState('PNG');
  const [targetFormat, setTargetFormat] = useState('JPG');
  
  const [isDragging, setIsDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [converSuccess, setConvertSuccess] = useState(false);
  
  const [convertedFileUrl, setConvertedFileUrl] = useState<string>('');
  const [convertedFileName, setConvertedFileName] = useState<string>('');

  // File Writer Mode (Monaco text-to-format creator)
  const [writerMode, setWriterMode] = useState(false);
  const [writerText, setWriterText] = useState('{\n  "name": "Notesdra",\n  "version": "2.0",\n  "status": "Online"\n}');
  const [writerExportFormat, setWriterExportFormat] = useState('JSON');

  // History list from database
  const [history, setHistory] = useState<ConversionHistory[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = () => {
    // Generate simulated/logged history
    const dHist: ConversionHistory[] = [
      { id: 'h-1', originalFormat: 'PNG', targetFormat: 'JPG', fileSize: 185102, status: 'Success', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: 'h-2', originalFormat: 'Markdown', targetFormat: 'HTML', fileSize: 1403, status: 'Success', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    ];
    setHistory(dHist);
  };

  // Drag and drop events triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    // Check sizes constraints (25MB guests, 100MB logged users)
    const sizeMB = selectedFile.size / (1024 * 1024);
    const limit = user ? 100 : 25;
    if (sizeMB > limit) {
      alert(`File size exceeds limit (${limit}MB for your account level).`);
      return;
    }

    setFile(selectedFile);
    setConvertSuccess(false);
    setConvertedFileUrl('');

    // Guess original format
    const nameExt = selectedFile.name.split('.').pop()?.toUpperCase() || '';
    if (SUPPORTED_IMGS.includes(nameExt)) {
      setOriginalFormat(nameExt);
      const possibleTargets = SUPPORTED_IMGS.filter(f => f !== nameExt);
      setTargetFormat(possibleTargets[0] || 'JPG');
    } else if (SUPPORTED_DOCS.includes(nameExt)) {
      setOriginalFormat(nameExt);
      const possibleTargets = SUPPORTED_DOCS.filter(f => f !== nameExt);
      setTargetFormat(possibleTargets[0] || 'HTML');
    }

    // Read payload
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
      
      // if textual log
      if (typeof result === 'string' && !result.includes('image/') && !result.includes('application/octet-stream')) {
        setFileTextContent(result);
      } else {
        setFileTextContent('');
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Convert triggered
  const handleConvert = async () => {
    if (!file && !writerMode) return;
    setConverting(true);
    setConvertSuccess(false);

    try {
      const payloadFile = writerMode ? writerText : fileBase64;
      const payloadOrigFormat = writerMode ? 'Markdown' : originalFormat;
      const payloadTargetFormat = writerMode ? writerExportFormat : targetFormat;
      const payloadName = writerMode ? `writer_draft.${writerExportFormat.toLowerCase()}` : file?.name || 'file';

      const response = await fetch('/api/converter/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: payloadFile,
          originalFormat: payloadOrigFormat,
          targetFormat: payloadTargetFormat,
          fileName: payloadName
        })
      });

      const parsed = await response.json();
      if (parsed.success && parsed.data) {
        setConvertSuccess(true);
        setConvertedFileName(parsed.data.fileName);
        setConvertedFileUrl(parsed.data.fileContent);
        
        // append history logs
        const newEntry: ConversionHistory = {
          id: Math.random().toString(),
          originalFormat: payloadOrigFormat,
          targetFormat: payloadTargetFormat,
          fileSize: writerMode ? writerText.length : file?.size || 1024,
          status: 'Success',
          createdAt: new Date().toISOString()
        };
        setHistory(prev => [newEntry, ...prev]);
      } else {
        alert(parsed.message || 'Conversion failed. Unsupported format pair.');
      }
    } catch (e) {
      alert('Network conversion timeout. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleWriterExport = () => {
    handleConvert();
  };

  const clearWorkspace = () => {
    setFile(null);
    setFileBase64('');
    setFileTextContent('');
    setConvertedFileUrl('');
    setConvertSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-indigo-400" />
            Universal Utility Converter
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Convert any formatted files, tables, data streams, and assets on-the-fly. No data is stored permanently.
          </p>
        </div>

        {/* Toggles writer vs upload mode */}
        <div className="flex items-center bg-[#1a1d27] border border-[#2d3148] p-1 rounded-xl">
          <button 
            onClick={() => setWriterMode(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${!writerMode ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            File Uploader
          </button>
          <button 
            onClick={() => setWriterMode(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${writerMode ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            File Creator Mode
          </button>
        </div>
      </div>

      {writerMode ? (
        /* ==================== WRITER MODE LAYOUT ==================== */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 space-y-4">
            <div className="border border-[#2d3148] rounded-xl overflow-hidden bg-[#1a1d27] shadow-xl h-[450px]">
              <div className="px-4 py-3 bg-[#242938] border-b border-[#2d3148] flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">Draft Exporter Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Export format:</label>
                  <select 
                    value={writerExportFormat}
                    onChange={(e) => setWriterExportFormat(e.target.value)}
                    className="px-2.5 py-1 bg-[#1a1d27] text-slate-300 rounded border border-[#2d3148] text-[10px] outline-none cursor-pointer"
                  >
                    {SUPPORTED_DOCS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-[calc(100%-48px)]">
                <Editor 
                  height="100%"
                  language={writerExportFormat.toLowerCase() === 'markdown' ? 'markdown' : writerExportFormat.toLowerCase()}
                  value={writerText}
                  onChange={(val) => setWriterText(val || '')}
                  theme="vs-dark"
                  options={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 13,
                    minimap: { enabled: false },
                    bracketPairColorization: { enabled: true },
                    automaticLayout: true
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Write documents, structured tables, or codes. Trigger exporter to package values down perfectly.
              </p>
              <button 
                onClick={handleWriterExport}
                disabled={converting}
                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>{converting ? 'Processing...' : 'Export File'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {converSuccess && convertedFileUrl && (
              <div className="p-5 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl space-y-4 animate-fade-in text-center">
                <span className="p-3 bg-emerald-500/10 rounded-full inline-block text-emerald-400 text-xl font-bold">✓</span>
                <div className="space-y-1">
                  <h4 className="text-slate-200 font-semibold text-sm">Export successfully compiled!</h4>
                  <p className="text-slate-500 text-xs font-mono">{convertedFileName}</p>
                </div>
                <a 
                  href={convertedFileUrl}
                  download={convertedFileName}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                >
                  <Download className="h-4 w-4" />
                  Download Export File
                </a>
              </div>
            )}

            {/* Static formats lists for user visibility */}
            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-500 mb-3 select-none tracking-wider text-[10px]">Supported Exporter Mappings</h3>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Structured Formats</span>
                  <span className="font-mono text-[10px] text-[#818cf8]">JSON ↔ CSV ↔ YAML</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2d3148]">
                  <span>Semantic Markups</span>
                  <span className="font-mono text-[10px] text-[#818cf8]">Markdown ↔ HTML</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2d3148]">
                  <span>Plain document</span>
                  <span className="font-mono text-[10px] text-[#818cf8]">TXT ↔ XML</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== FILE UPLOAD CONVERTER LAYOUT ==================== */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 space-y-4">
            
            {/* Drag and Drop area */}
            {!file ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 md:p-14 text-center cursor-pointer transition-all duration-300 h-[280px] flex flex-col justify-center items-center ${
                  isDragging 
                    ? 'border-indigo-500 bg-[#1e2030] shadow-lg' 
                    : 'border-[#2d3148] hover:border-indigo-500/50 bg-[#1a1d27]/40'
                }`}
                onClick={() => document.getElementById('drag-drop-input')?.click()}
              >
                <input 
                  type="file" 
                  id="drag-drop-input"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <FileUp className="h-12 w-12 text-slate-400 mb-4 animate-pulse" />
                <h3 className="text-slate-200 font-semibold text-sm md:text-base">Drag and drop file here</h3>
                <p className="text-slate-500 text-xs mt-1.5">
                  or <span className="text-indigo-400 font-bold hover:underline">browse files</span> from computer memory
                </p>
                <div className="text-[10px] text-slate-600 font-mono mt-3">
                  Limits: {user ? '100MB premium user scope' : '25MB guest sandbox scope'}
                </div>
              </div>
            ) : (
              /* Active Selected File State Frame */
              <div className="p-5 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#2d3148] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl leading-none">
                      {file.type.startsWith('image/') ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </span>
                    <div>
                      <h3 className="text-slate-200 font-bold text-sm truncate max-w-[240px] md:max-w-md">{file.name}</h3>
                      <p className="text-[#818cf8] text-[9px] font-mono uppercase mt-0.5">{(file.size / 1024).toFixed(1)} KB loaded</p>
                    </div>
                  </div>
                  <button 
                    onClick={clearWorkspace}
                    className="p-1.5 bg-[#0f1117] hover:bg-slate-850 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors duration-150"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                {/* Configurations mapping bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-[#0f1117] rounded-lg border border-[#2d3148]">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-1">Source Format</label>
                    <div className="text-slate-200 text-sm font-semibold bg-[#1a1d27] border border-[#2d3148] rounded-lg px-2 py-1 select-none">
                      {originalFormat}
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-block p-1 bg-[#1a1d27] border border-[#2d3148] rounded-full text-slate-400 text-xs">→</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-1">Target Format</label>
                    <select 
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value)}
                      className="w-full bg-[#1a1d27] border border-[#2d3148] text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none font-bold cursor-pointer"
                    >
                      {SUPPORTED_IMGS.includes(originalFormat) ? (
                        SUPPORTED_IMGS.filter(f => f !== originalFormat).map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))
                      ) : (
                        SUPPORTED_DOCS.filter(f => f !== originalFormat).map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Convert Trigger CTA */}
                <div className="flex justify-end">
                  <button 
                    onClick={handleConvert}
                    disabled={converting}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white rounded-xl text-xs md:text-sm font-semibold cursor-pointer shadow-md transition"
                  >
                    {converting ? 'Processing Format conversion...' : 'Trigger Conversion'}
                  </button>
                </div>
              </div>
            )}

            {/* Universal Reader File Previews Box */}
            {file && (
              <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-2 select-none h-[220px] flex flex-col">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  Loaded Universal File Preview
                </h4>
                <div className="bg-[#0f1117] p-3 rounded-lg border border-[#2d3148] flex-grow overflow-auto flex items-center justify-center text-slate-500 text-xs">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={fileBase64} 
                      alt="loaded frame" 
                      className="max-h-[140px] max-w-full rounded object-contain border border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : fileTextContent ? (
                    <pre className="w-full text-[11px] h-full text-slate-400 font-mono text-wrap border-0 p-0 bg-transparent overflow-auto">
                      {fileTextContent.substring(0, 500)}
                    </pre>
                  ) : (
                    <div className="text-center font-mono">
                      <FileCode className="h-6 w-6 text-slate-600 mx-auto mb-1.5" />
                      Binary/Doc container file (No inline reader support)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Download card upon compilation */}
            {converSuccess && convertedFileUrl && (
              <div className="p-5 bg-emerald-950/25 border border-emerald-900/50 rounded-2xl text-center space-y-4 animate-fade-in shadow-lg">
                <span className="p-3 bg-emerald-500/15 rounded-full inline-block text-emerald-400 font-bold leading-none">✓</span>
                <div>
                  <h4 className="text-slate-200 font-semibold text-sm">Conversion Complete</h4>
                  <p className="text-slate-500 text-[10px] font-mono mt-1 w-full truncate inline-block">{convertedFileName}</p>
                </div>
                <a 
                  href={convertedFileUrl}
                  download={convertedFileName}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                >
                  <Download className="h-4 w-4" />
                  Download Converted File
                </a>
              </div>
            )}

            {/* Simulated historical actions */}
            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-3 select-none font-mono uppercase text-[10px] tracking-wider text-slate-500">
                <History className="h-3.5 w-3.5 text-slate-400" />
                Historic Operations Logs
              </h3>
              <div className="space-y-2">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#0f1117] border border-[#2d3148]">
                    <div>
                      <span className="font-mono uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-[4px] text-[8px] mr-2">
                        {item.originalFormat} → {item.targetFormat}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">{(item.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">Success</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
