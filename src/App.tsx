import React from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import DeveloperWorkspace from './components/DeveloperWorkspace';
import { Smartphone, BookOpen, Key, Link } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* LEFT: Phone Simulation Playground & Features Showcase */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Banner metadata details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
              <Smartphone className="w-5.5 h-5.5 text-blue-600" />
              <span>Mobile Expo + Supabase Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Test mobile features inside the simulation, then copy/download exportable codebase bundles.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 font-mono shadow-xs text-slate-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-slate-500">Environment Sandbox:</span>
            <span className="text-emerald-600 font-bold">Simulator Online</span>
          </div>
        </div>

        {/* Dynamic Mobile Layout Center */}
        <div className="flex-1 flex flex-col justify-center items-center py-4">
          <PhoneSimulator />
        </div>

        {/* Feature Checklists Footer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 font-mono tracking-wider uppercase">
            🧪 Simulated Integration Modules
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-2xs">
              <span className="font-bold text-slate-800 block mb-0.5">🔒 Authentication Flows</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">Safe email/password signups with verified pending states.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-2xs">
              <span className="font-bold text-slate-800 block mb-0.5">👥 RBAC Switching</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">Flip instantly between active customer and admin widgets.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-2xs">
              <span className="font-bold text-slate-800 block mb-0.5">📦 Order Lifecycles</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">Follow standard transition rules with trace timber histories.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-2xs">
              <span className="font-bold text-slate-800 block mb-0.5">💬 Support Ticketing</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">Two-way client-agent thread messaging with custom categories.</p>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT: Production-ready Code Exporter & SQL Configuration Studio */}
      <div className="w-full md:w-[480px] lg:w-[560px] flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-gray-200 bg-white">
        <DeveloperWorkspace />
      </div>

    </div>
  );
}
