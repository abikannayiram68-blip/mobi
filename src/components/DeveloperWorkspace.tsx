import React, { useState } from 'react';
import { EXPO_CODEBASE, CodeFile } from '../expoCodebase';
import { Copy, Check, Download, Terminal, Database, FileCode, CheckCircle, HelpCircle } from 'lucide-react';

export default function DeveloperWorkspace() {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(EXPO_CODEBASE[1]); // default to SQL Schema
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'code' | 'sql'>('code');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (file: CodeFile) => {
    const element = document.createElement("a");
    const blob = new Blob([file.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = file.path;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="dev-workspace" className="flex flex-col h-full bg-gray-50 border-l border-gray-200 text-slate-800">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-900 uppercase font-mono">
            Expo + Supabase Engine
          </h2>
        </div>
        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2.5 py-0.5 text-xs font-mono font-medium">
          Ready for Mobile
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-100/80 text-xs font-medium font-mono">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center space-x-2 px-5 py-3 border-r border-gray-200 transition-all ${
            activeTab === 'code' 
              ? 'bg-white text-slate-900 border-t-2 border-t-blue-600 font-bold' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Expo Code Assets</span>
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center space-x-2 px-5 py-3 border-r border-gray-200 transition-all ${
            activeTab === 'sql' 
              ? 'bg-white text-slate-900 border-t-2 border-t-emerald-600 font-bold' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase SQL Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center space-x-2 px-5 py-3 transition-all ${
            activeTab === 'docs' 
              ? 'bg-white text-slate-900 border-t-2 border-t-purple-600 font-bold' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Setup Instructions</span>
        </button>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Tree Panel (Only shown in Code assets tab) - Structured like High Density Admin Sidebar */}
        {activeTab === 'code' && (
          <div className="w-56 border-r border-gray-200 bg-[#1E293B] flex flex-col justify-between">
            <div className="p-3">
              <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase font-mono block mb-3 pl-1">
                Project Tree
              </span>
              <div className="space-y-1">
                {EXPO_CODEBASE.filter(f => f.path !== 'supabase_schema.sql').map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left font-mono text-xs px-2.5 py-2 rounded transition-all flex items-center space-x-2 ${
                      selectedFile.path === file.path
                        ? 'bg-[#3B82F6] text-white font-semibold shadow-sm'
                        : 'text-[#F8FAFC] opacity-80 hover:opacity-100 hover:bg-[#334155]'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-[#111827] text-[11px] text-[#94A3B8] border-t border-[#334155] leading-relaxed">
              Select a file to preview and export standard React Native boilerplate logic.
            </div>
          </div>
        )}

        {/* Right Editor Container */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {activeTab === 'docs' ? (
            <div className="flex-1 overflow-y-auto p-6 font-sans space-y-6 text-slate-800 bg-gray-50">
              <h3 className="text-lg font-bold text-slate-900">⚙️ Expo + Supabase Native Setup Guide</h3>
              
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                  <h4 className="font-bold text-blue-700 mb-1 flex items-center space-x-2">
                    <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-md mr-2 font-mono">1</span>
                    Local Environment Provisioning
                  </h4>
                  <p className="text-sm text-slate-650 mt-2">
                    Establish a clean directory and scaffold the codebase using Expo CLI:
                  </p>
                  <pre className="bg-slate-950 border border-slate-900 p-3 rounded-lg font-mono text-xs text-blue-300 mt-2 overflow-x-auto leading-relaxed">
                    {`npx create-expo-app simple-supabase-ecommerce -t expo-template-blank-typescript
cd simple-supabase-ecommerce
npm install @supabase/supabase-js @react-native-async-storage/async-storage zustand lucide-react-native`}
                  </pre>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                  <h4 className="font-bold text-emerald-700 mb-1 flex items-center space-x-2">
                    <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-md mr-2 font-mono">2</span>
                    Supabase Configuration & RLS Actions
                  </h4>
                  <p className="text-sm text-slate-650 mt-2">
                    Go to the <b>Supabase SQL Editor</b>, paste the script provided in the <b>Supabase SQL Rules</b> tab, and execute it. 
                    This establishes:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-500 mt-2 ml-2 space-y-1">
                    <li>Dynamic automatic profiles mirroring of the signup trigger</li>
                    <li>Row-Level Security (RLS) ensuring customers only access their own orders and support logs</li>
                    <li>Dedicated role privileges block for administrative permissions</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                  <h4 className="font-bold text-purple-700 mb-1 flex items-center space-x-2">
                    <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-0.5 rounded-md mr-2 font-mono">3</span>
                    Linking API Keys via .env
                  </h4>
                  <p className="text-sm text-slate-650 mt-2">
                    Create an <code className="text-slate-800 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">.env</code> in the project root file and populate it with your Supabase credentials:
                  </p>
                  <pre className="bg-slate-950 border border-slate-900 p-3 rounded-lg font-mono text-xs text-purple-300 mt-2 overflow-x-auto leading-relaxed">
                    {`EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"`}
                  </pre>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                  <h4 className="font-bold text-amber-700 mb-1 flex items-center space-x-2">
                    <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-md mr-2 font-mono">4</span>
                    Building Native Android APK (Expo EAS Build)
                  </h4>
                  <p className="text-sm text-slate-650 mt-2">
                    An APK is built on Expo&apos;s cloud infrastructure (EAS Server) or your computer. Since our environment is a secure web container, you can instantly export this fully functional codebase and build your APK with a single command!
                  </p>
                  
                  {/* Tamil Instructions Banner */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs leading-relaxed text-blue-900">
                    <p className="font-bold mb-1">📢 தமிழ் விளக்கம் (Tamil Guide):</p>
                    <p>
                      நமது AI சிமுலேட்டர் ஒரு பாதுகாப்பான பிரவுசர் சூழலில் இயங்குவதால், இதனுள்ளே நேரடியாக மொபைல் APK கோப்பை உருவாக்க இயலாது. அதற்கு <b>Android SDK / Java Development Kit</b> மற்றும் Expo Cloud கணக்கு தேவை. 
                    </p>
                    <p className="mt-1">
                      ஆனால் கவலைப்படாதீர்கள்! இந்த குறியீட்டை <b>ZIP ஆக பதிவிறக்கம் செய்து</b> (கீழே இடதுபுறம் உள்ள Settings ஐகானை கிளிக் செய்யவும்) உங்கள் கணினியில் பின்வரும் எளிய கட்டளைகளை கொண்டு 10 நிமிடங்களில் நேரடி <b>APK</b> ஆக மாற்றலாம்.
                    </p>
                  </div>

                  <ol className="list-decimal list-inside text-xs text-slate-600 mt-4 ml-2 space-y-1.5 list-image-none">
                    <li>Download/Export this project and unzip it onto your computer.</li>
                    <li>Open your computer&apos;s terminal in the unzipped folder.</li>
                    <li>Install Expo&apos;s build tool globally and log in:</li>
                  </ol>
                  <pre className="bg-slate-950 border border-slate-900 p-3 rounded-lg font-mono text-xs text-amber-300 mt-2 overflow-x-auto leading-relaxed">
                    {`# Install EAS CLI globally
npm install -g eas-cli

# Log into your Expo account (Create one free at expo.dev)
eas login`}
                  </pre>
                  
                  <ol className="list-decimal list-inside text-xs text-slate-600 mt-4 ml-2 space-y-1.5" start={4}>
                    <li>Trigger the cloud build using our pre-configured <code className="bg-gray-100 text-amber-900 px-1 py-0.5 rounded font-mono">eas.json</code> profile (which compiles a direct installable APK instead of play-store AAB):</li>
                  </ol>
                  <pre className="bg-slate-950 border border-slate-900 p-3 rounded-lg font-mono text-xs text-emerald-400 mt-2 overflow-x-auto leading-relaxed">
                    {`# Compile the installer APK instantly
eas build -p android --profile preview`}
                  </pre>
                  
                  <div className="text-xs text-slate-500 mt-3 space-y-1.5 leading-relaxed">
                    <p>• Once completed, EAS will print a <b>QR Code</b> and a direct <b>download link</b> on your terminal screen!</p>
                    <p>• Scan the QR code or click the link to download your completed installable <b>Android APK</b> directly onto any phone!</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'sql' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-mono font-bold">PostgreSQL Migrations & RLS Policies</span>
                <button
                  onClick={() => handleCopy(EXPO_CODEBASE[1].content)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL Schema'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono border-t border-slate-900">
                <pre className="text-xs text-slate-200 select-all whitespace-pre-wrap leading-relaxed">
                  {EXPO_CODEBASE[1].content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-mono font-bold">{selectedFile.path}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 font-medium">{selectedFile.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(selectedFile)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-slate-700 rounded transition shadow-2xs"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(selectedFile.content)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy File'}</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono border-t border-slate-900">
                <pre className="text-xs text-slate-200 whitespace-pre scrollbar-thin">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
