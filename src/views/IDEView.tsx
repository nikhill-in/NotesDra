import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { User, IDESession } from '../types';
import { Play, Save, Code, Terminal, Layers, Trash, HelpCircle, Check, FileCode2, Clock, Cpu } from 'lucide-react';

interface IDEViewProps {
  user: User | null;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', defaultCode: `// Dynamic Javascript Playground\nconst greeting = "Hello, Notesdra Developer!";\nconsole.log(greeting);\n\n// Create a cool loop\nfor(let i = 1; i <= 5; i++) {\n  console.log(\`Running loop level #\${i}\`);\n}` },
  { id: 'python', name: 'Python 3', defaultCode: `# Dynamic Python sandbox\ndef greet(name):\n    return f"Hello, {name}! Welcome to the compiler sandbox."\n\nprint(greet("Notesdra User"))\n\n# Dynamic iterations\nfor i in range(1, 4):\n    print(f"Iterating index {i}")` },
  { id: 'html', name: 'HTML/CSS/JS', defaultCode: `<!-- Write semantic markup -->\n<div class="card">\n  <h2>Notesdra Live Design Frame</h2>\n  <p>Modify HTML and CSS properties. Re-evaluates instantly inside sandboxed frames.</p>\n  <button onclick="triggerAlert()">Interactive Trigger</button>\n</div>\n\n<style>\n  body { \n    background: #0f1117;\n    color: #e2e8f0;\n    font-family: sans-serif;\n    padding: 2rem;\n    display: flex;\n    justify-content: center;\n  }\n  .card {\n    background: #1a1d27;\n    border: 1px solid #2d3148;\n    border-radius: 12px;\n    padding: 24px;\n    max-width: 400px;\n    box-shadow: 0 4px 12px rgba(0,0,0,0.5);\n  }\n  h2 { color: #6366f1; margin-top: 0; }\n  button {\n    background: #6366f1;\n    color: white;\n    border: none;\n    padding: 8px 16px;\n    border-radius: 8px;\n    cursor: pointer;\n    margin-top: 10px;\n  }\n  button:hover { background: #4f46e5; }\n</style>\n\n<script>\n  function triggerAlert() {\n    alert("Greetings from Notesdra sandboxed layout client!");\n  }\n</script>` },
  { id: 'c', name: 'C', defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello from standard C runner!\\n");\n    return 0;\n}` },
  { id: 'cpp', name: 'C++', defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Standard C++ stream execution live!" << endl;\n    return 0;\n}` },
  { id: 'java', name: 'Java', defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World from Java!");\n    }\n}` },
  { id: 'typescript', name: 'TypeScript', defaultCode: `interface Profile {\n  id: number;\n  username: string;\n}\n\nconst player: Profile = { id: 101, username: "Architect" };\nconsole.log(\`TypeScript Object validation matched:\`, player);` },
  { id: 'php', name: 'PHP', defaultCode: `<?php\necho "Hello World from PHP compiler router\\n";\n` },
  { id: 'ruby', name: 'Ruby', defaultCode: `def solve_sum(num)\n  puts "Processing range evaluation"\nend\nsolve_sum(5)\nputs "Ruby running successfully"` },
  { id: 'go', name: 'Go', defaultCode: `package main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Dynamic Go compiler context online")\n}` }
];

export default function IDEView({ user }: IDEViewProps) {
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [loading, setLoading] = useState(false);
  const [execTime, setExecTime] = useState('0.000s');
  const [execMemory, setExecMemory] = useState('0MB');

  const [savedSessions, setSavedSessions] = useState<IDESession[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load language default codes or fetch user saved sessions on mount
  useEffect(() => {
    const langObj = LANGUAGES.find(l => l.id === selectedLang);
    if (langObj) {
      setCode(langObj.defaultCode);
    }
    // reset outputs
    setStdout('');
    setStderr('');
  }, [selectedLang]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = () => {
    fetch('/api/ide/sessions')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && Array.isArray(payload.data)) {
          setSavedSessions(payload.data);
        }
      })
      .catch(err => console.error('Error fetching sessions', err));
  };

  const handleRun = async () => {
    setLoading(true);
    setStdout('');
    setStderr('');

    try {
      const response = await fetch('/api/ide/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: selectedLang, stdin })
      });
      const resData = await response.json();

      if (resData.success && resData.data) {
        setStdout(resData.data.stdout || '');
        setStderr(resData.data.stderr || '');
        setExecTime(resData.data.time || '0.012s');
        setExecMemory(resData.data.memory || '1.8MB');
      } else {
        setStderr(resData.message || 'Execution error');
      }
    } catch (err: any) {
      setStderr('Execution request timed out or compilation failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    fetch('/api/ide/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: selectedLang, output: stdout || stderr })
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          setSavedSuccess(true);
          fetchSessions();
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      })
      .catch(err => console.error('Save failed', err))
      .finally(() => setSaving(false));
  };

  const loadSavedWorkspace = (session: IDESession) => {
    setSelectedLang(session.language);
    setCode(session.code);
    if (session.output) {
      setStdout(session.output);
    }
  };

  // Live Triple Pane Frame builder for HTML/JS
  const getIFrameSrcDoc = () => {
    return code;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-100 flex items-center gap-2">
            <Code className="h-7 w-7 text-indigo-400" />
            Developer Code Sandbox
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Zero-installation, multi-language executor sandbox with responsive system telemetry parameters.
          </p>
        </div>

        {/* Configurations Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Language Selector */}
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-3.5 py-1.5 bg-[#1a1d27] border border-[#2d3148] text-slate-300 text-xs md:text-sm rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 cursor-pointer font-sans"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>

          {/* Action buttons */}
          {user && (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a1d27] border border-[#2d3148] hover:border-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Save className={`h-4 w-4 ${savedSuccess ? 'text-emerald-500 animate-pulse' : ''}`} />
              <span>{savedSuccess ? 'Saved!' : 'Save Code'}</span>
            </button>
          )}

          <button 
            onClick={handleRun}
            disabled={loading}
            className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-500/20"
          >
            <Play className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Compiling...' : 'Run sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Grid editor block layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Monaco workspace on left panel (3 cols width) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="relative border border-[#2d3148] rounded-xl bg-[#1a1d27] overflow-hidden shadow-2xl h-[450px] md:h-[550px]">
            {/* editor title line */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#242938] border-b border-[#2d3148] select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></span>
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"></span>
                <span className="text-[10px] font-mono text-slate-400 ml-2 uppercase font-bold">
                  {selectedLang} workspace module
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-indigo-400 bg-indigo-500/10 uppercase border border-indigo-500/20 font-mono">
                VSCode Theme Enabled
              </span>
            </div>

            {/* Actual editor wrapper */}
            <div className="w-full h-[calc(100%-45px)]">
              <Editor
                height="100%"
                language={selectedLang === 'html' ? 'html' : selectedLang === 'typescript' ? 'typescript' : selectedLang === 'cpp' ? 'cpp' : selectedLang}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  bracketPairColorization: { enabled: true },
                  padding: { top: 12, bottom: 12 },
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>

          {/* Stdin box for dynamic variables input */}
          <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 select-none font-mono uppercase tracking-wider text-[10px] text-slate-500">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              Standard Input Stream (stdin)
            </h3>
            <textarea 
              rows={2}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Provide dynamic program parameters (such as mock input lines)..."
              className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs md:text-sm text-slate-300 outline-none focus:border-indigo-500 placeholder-slate-650 font-mono"
            />
          </div>
        </div>

        {/* Outputs details + telemetry panel on right panel (1 col width) */}
        <div className="space-y-4">
          
          {/* HTML Preview (Inside IFrame Box) */}
          {selectedLang === 'html' ? (
            <div className="border border-[#2d3148] bg-[#1a1d27] rounded-xl overflow-hidden h-[260px] flex flex-col shadow-lg">
              <div className="px-4 py-2.5 bg-[#242938] border-b border-[#2d3148] flex items-center gap-2 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-300 font-mono text-[10px] uppercase tracking-wider text-slate-450">Live Render Window</span>
              </div>
              <iframe 
                ref={iframeRef}
                srcDoc={getIFrameSrcDoc()}
                title="Notesdra HTML Sandbox Frame"
                className="w-full h-full bg-white outline-none border-0"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            /* Telemetry logs block */
            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 select-none font-mono text-[10px]">
                <Layers className="h-3.5 w-3.5" />
                Execution Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#0f1117] rounded-xl border border-[#2d3148]">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono uppercase font-bold">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    Time Elapsed
                  </div>
                  <div className="text-[#818cf8] text-sm font-semibold font-mono mt-1">{execTime}</div>
                </div>

                <div className="p-2.5 bg-[#0f1117] rounded-xl border border-[#2d3148]">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono uppercase font-bold">
                    <Cpu className="h-3 w-3 text-emerald-400" />
                    Memory Limit
                  </div>
                  <div className="text-emerald-400 text-sm font-semibold font-mono mt-1">{execMemory}</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 leading-normal border-t border-[#2d3148] pt-3 font-mono">
                Execution Timeout: <strong className="text-slate-400">10s max</strong>.<br />
                Memory Ceiling: <strong className="text-slate-400">256MB max</strong>.
              </div>
            </div>
          )}

          {/* Standard Outputs panel */}
          <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 select-none font-mono uppercase tracking-wider text-[10px] text-slate-500">Console stdout</h3>
            <div className="p-3 bg-[#0f1117] rounded-lg border border-[#2d3148] min-h-[140px] font-mono text-xs text-slate-300 break-all overflow-y-auto whitespace-pre-wrap">
              {stdout ? (
                <span className="text-[#e2e8f0]">{stdout}</span>
              ) : stderr ? (
                <span className="text-rose-450 font-bold">{stderr}</span>
              ) : (
                <span className="text-slate-650 block text-center pt-8 italic text-[11px]">
                  No execution logs yet. Click 'Run Sandbox' to compile code.
                </span>
              )}
            </div>
          </div>

          {/* Logged user saved codes list */}
          {user && (
            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 select-none font-mono uppercase tracking-wider text-[10px] text-slate-500">
                <FileCode2 className="h-3.5 w-3.5 text-slate-400" />
                Saved Code Snippets
              </h3>
              {savedSessions.length > 0 ? (
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {savedSessions.map(session => (
                    <button 
                      key={session.id}
                      onClick={() => loadSavedWorkspace(session)}
                      className="w-full text-left p-2.5 bg-[#0f1117] hover:bg-slate-800 rounded-lg border border-[#2d3148] text-[11px] truncate block outline-none transition cursor-pointer"
                    >
                      <span className="font-semibold text-indigo-400 uppercase mr-1.5 font-mono">[{session.language}]</span>
                      <span className="text-slate-300 text-[10px]">Saved {new Date(session.savedAt).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">No saved workspaces. Write code and click 'Save Code'.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
