'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  ShieldAlert,
  Copy,
  Check,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
  Code2
} from 'lucide-react';

// Custom Code Editor Component to bypass peer-dep issues in React 19
interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

function CodeEditor({ value, onChange, placeholder, readOnly = false }: CodeEditorProps) {
  const lineCount = value.split('\n').length || 1;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50 dark:bg-[#0a0a0a] font-mono text-sm leading-6 overflow-hidden h-96 relative">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="select-none text-right pr-3 pl-2 py-3 bg-neutral-100/50 dark:bg-[#030303]/50 text-neutral-400 dark:text-neutral-600 border-r border-neutral-200 dark:border-neutral-800 text-xs min-w-[2.5rem] overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {lines.map((num) => (
          <div key={num} className="h-6">{num}</div>
        ))}
      </div>
      {/* Editor Content */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        wrap="off"
        className="flex-1 p-3 bg-transparent text-neutral-900 dark:text-neutral-100 outline-none resize-none overflow-auto whitespace-pre font-mono text-sm leading-6 h-full"
      />
    </div>
  );
}

interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function calculateDiff(oldStr: string, newStr: string): DiffChange[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  const dp: number[][] = Array(oldLines.length + 1)
    .fill(null)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffChange[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        value: oldLines[i - 1],
        oldLineNum: i,
        newLineNum: j
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        value: newLines[j - 1],
        newLineNum: j
      });
      j--;
    } else {
      result.unshift({
        type: 'removed',
        value: oldLines[i - 1],
        oldLineNum: i
      });
      i--;
    }
  }

  return result;
}

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
}

function DiffViewer({ oldCode, newCode }: DiffViewerProps) {
  const diffs = calculateDiff(oldCode, newCode);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50 dark:bg-[#0a0a0a] font-mono text-sm leading-6 overflow-hidden h-[490px] flex flex-col">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#050505] text-xs font-semibold text-neutral-500 select-none">
        <span>Inline Diff View</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/10 border border-red-500/20 rounded"></span> Removed</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500/10 border border-green-500/20 rounded"></span> Newly Generated</span>
        </div>
      </div>
      {/* Diff Content */}
      <div className="flex-1 overflow-auto p-3 whitespace-pre select-text">
        <table className="w-full border-collapse">
          <tbody>
            {diffs.map((diff, index) => {
              let rowBg = '';
              let prefix = ' ';
              let prefixColor = 'text-neutral-400';
              let textColor = 'text-neutral-900 dark:text-neutral-100';

              if (diff.type === 'added') {
                rowBg = 'bg-green-500/10 dark:bg-green-950/20';
                prefix = '+';
                prefixColor = 'text-green-500 font-bold';
                textColor = 'text-green-700 dark:text-green-300';
              } else if (diff.type === 'removed') {
                rowBg = 'bg-red-500/10 dark:bg-red-950/20';
                prefix = '-';
                prefixColor = 'text-red-500 font-bold';
                textColor = 'text-red-700 dark:text-red-300';
              }

              return (
                <tr key={index} className={`h-6 ${rowBg} hover:bg-neutral-200/20 dark:hover:bg-neutral-800/20 transition-colors`}>
                  {/* Line Number Columns */}
                  <td className="w-10 text-right pr-3 select-none text-neutral-400 dark:text-neutral-600 text-xs border-r border-neutral-200 dark:border-neutral-800 pl-1">
                    {diff.oldLineNum || ''}
                  </td>
                  <td className="w-10 text-right pr-3 select-none text-neutral-400 dark:text-neutral-600 text-xs border-r border-neutral-200 dark:border-neutral-800 pl-1">
                    {diff.newLineNum || ''}
                  </td>
                  {/* Prefix Column */}
                  <td className={`w-6 text-center select-none font-bold text-sm ${prefixColor}`}>
                    {prefix}
                  </td>
                  {/* Code Line Column */}
                  <td className={`pl-2 font-mono text-sm leading-6 align-middle ${textColor}`}>
                    {diff.value || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'generator' | 'modifier' | 'auditor'>('generator');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Copy status feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab 1: Logic Generator States
  const [prompt, setPrompt] = useState('');
  const [jsonContext, setJsonContext] = useState('');
  const [explain, setExplain] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState('');

  // Tab 2: Code Modifier States
  const [modifierOriginalCode, setModifierOriginalCode] = useState('');
  const [modifierInstructions, setModifierInstructions] = useState('');
  const [modifierModifiedCode, setModifierModifiedCode] = useState('');
  const [modifierLoading, setModifierLoading] = useState(false);
  const [modifierError, setModifierError] = useState('');

  // Tab 3: FreeMarker Auditor & Linter States
  const [auditCode, setAuditCode] = useState('');
  type AuditIssue = { severity: 'error' | 'warning' | 'info'; line?: number; message: string; suggestion: string };
  const [auditResult, setAuditResult] = useState<{ isValid: boolean; issues: AuditIssue[] } | null>(null);
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [auditorError, setAuditorError] = useState('');

  // Theme Sync on Mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(isDark ? 'dark' : 'light');

    // Check if Vertex AI or API key is configured
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'audit', code: '<#-- Ping -- >' })
    })
      .then(res => res.json())
      .then(data => {
        setIsMockMode(!!data.isMock);
      })
      .catch(() => {
        setIsMockMode(true);
      });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preset Loaders
  const loadGeneratorPreset = (type: 'promo' | 'cart') => {
    if (type === 'promo') {
      setPrompt('If the user is VIP, render a golden promo banner with code "GOLDVIP". If they are premium, show code "PREMIUM10". Otherwise, display a standard signup link.');
      setJsonContext(JSON.stringify({
        "user": {
          "tier": "VIP",
          "name": "Alex Mercer"
        }
      }, null, 2));
      setIsContextCollapsed(false);
    } else {
      setPrompt('Loop through the active items array. For each item, display name, category, and price formatted as currency. If active is false, skip the item. If the array is empty, output a "No items found" message.');
      setJsonContext(JSON.stringify({
        "items": [
          { "name": "Leather Notebook", "category": "Office", "price": 24.99, "active": true },
          { "name": "Steel Water Bottle", "category": "Lifestyle", "price": 35.00, "active": true },
          { "name": "Bluetooth Speaker", "category": "Tech", "price": 89.95, "active": false }
        ]
      }, null, 2));
      setIsContextCollapsed(false);
    }
  };

  const loadModifierPreset = (type: 'vip' | 'border') => {
    if (type === 'vip') {
      setModifierOriginalCode(`<table border="0" cellpadding="10" cellspacing="0" width="100%">
  <tr>
    <td style="font-family: sans-serif; font-size: 16px;">
      Hello \${(user.name)!"Valued Member"}!
    </td>
  </tr>
</table>`);
      setModifierInstructions('Wrap this section in a conditional check so it only renders if user has gold loyalty status (user.isGold is true).');
    } else {
      setModifierOriginalCode(`<#if ((user.premium)!false)>
  Hello \${(user.name)!"Subscriber"}!
</#if>`);
      setModifierInstructions('Wrap this text in a standard HTML email layout table with a 1px border, 15px cell padding, and light gray background.');
    }
  };

  const loadAuditorPreset = (type: 'syntax' | 'safety' | 'perf') => {
    if (type === 'syntax') {
      setAuditCode(`<#-- Invalid missing closing conditional tag -->
<#if user.isPremium!false>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="welcome">
    <tr>
      <td style="padding: 10px;">
        <h3>Welcome premium user!</h3>
      </td>
    </tr>
  </table>
<#-- Missing </#if> here -- >`);
    } else if (type === 'safety') {
      setAuditCode(`<#-- Missing null safe checks will crash emails -->
<p>Hello \${user.firstName},</p>
<p>Your subscription to \${subscription.planName} expires on \${subscription.expiry}.</p>`);
    } else {
      setAuditCode(`<#-- Performance bottleneck: Filtering list inline during loop -->
<ul>
  <#list orders as order>
    <#list order.items?filter(i -> i.price > 150) as premiumItem>
      <li>\${premiumItem.name!"Item"} - \${premiumItem.price?string.currency}</li>
    </#list>
  </#list>
</ul>`);
    }
  };

  // API Call: Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGeneratorError('Please enter a natural language request.');
      return;
    }

    setGeneratorLoading(true);
    setGeneratorError('');
    setGeneratedCode('');
    setExplanationText('');

    let parsedContext = null;
    if (jsonContext.trim()) {
      try {
        parsedContext = JSON.parse(jsonContext);
      } catch {
        setGeneratorError('Invalid JSON in Sample Context. Please verify your formatting.');
        setGeneratorLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          prompt,
          context: parsedContext,
          explain
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedCode(data.code || '');
      setExplanationText(data.explanation || '');
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during code generation.';
      setGeneratorError(message);
    } finally {
      setGeneratorLoading(false);
    }
  };

  // API Call: Modify
  const handleModify = async () => {
    if (!modifierOriginalCode.trim()) {
      setModifierError('Please enter the original code to modify.');
      return;
    }
    if (!modifierInstructions.trim()) {
      setModifierError('Please enter modification instructions.');
      return;
    }

    setModifierLoading(true);
    setModifierError('');
    setModifierModifiedCode('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'modify',
          code: modifierOriginalCode,
          instructions: modifierInstructions
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setModifierModifiedCode(data.code || '');
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during code modification.';
      setModifierError(message);
    } finally {
      setModifierLoading(false);
    }
  };

  // API Call: Audit
  const handleAudit = async () => {
    if (!auditCode.trim()) {
      setAuditorError('Please enter FreeMarker code to audit.');
      return;
    }

    setAuditorLoading(true);
    setAuditorError('');
    setAuditResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'audit',
          code: auditCode
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAuditResult({
        isValid: data.isValid,
        issues: data.issues || []
      });
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during auditing.';
      setAuditorError(message);
    } finally {
      setAuditorLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-neutral-50 transition-colors duration-150">

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 flex flex-col p-6 shrink-0 bg-neutral-50/50 dark:bg-black">

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center shrink-0">
              <span className="text-white dark:text-black font-mono font-bold text-sm">qm</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">quickmarker</h1>
          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'generator'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
              }`}
          >
            <Wand2 className="w-4 h-4" />
            Logic Generator
          </button>

          <button
            onClick={() => setActiveTab('modifier')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'modifier'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
              }`}
          >
            <Code2 className="w-4 h-4" />
            Code Modifier
          </button>

          <button
            onClick={() => setActiveTab('auditor')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'auditor'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
              }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Auditor & Linter
          </button>
        </nav>

        {/* Theme and Mode Info Footer */}
        <div className="mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-[9px] text-neutral-400 dark:text-neutral-600 font-mono tracking-wider pt-1">
            2026 @ BY VIJAY DHYANI
          </div>

          {isMockMode && (
            <p className="text-[10px] text-neutral-500 leading-normal">
              No API Key detected. Currently falling back to sandbox outputs.
            </p>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">

        {/* TAB 1: LOGIC GENERATOR */}
        {activeTab === 'generator' && (
          <div className="space-y-6">

            {/* Header info */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Logic Generator
                <Sparkles className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Generate error-free Apache FreeMarker template code using natural language requests.
              </p>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">Try examples:</span>
              <button
                onClick={() => loadGeneratorPreset('promo')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium"
              >
                Promo Announcement
              </button>
              <button
                onClick={() => loadGeneratorPreset('cart')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium"
              >
                Abandoned Cart Loop
              </button>
            </div>

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Input Panel */}
              <div className="space-y-4">

                {/* Request Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="prompt" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Natural Language Request
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., If user is a subscriber and has premium status, show the active voucher, otherwise show a subscribe button..."
                    rows={4}
                    className="w-full border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 outline-none rounded-md px-3 py-2.5 text-sm transition-colors placeholder:text-neutral-400"
                  />
                </div>

                {/* Collapsible Sample JSON Context */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden bg-neutral-50/50 dark:bg-[#050505]">
                  <button
                    onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <span>Sample JSON Context (Optional)</span>
                    {isContextCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>

                  {!isContextCollapsed && (
                    <div className="p-3">
                      <p className="text-[11px] text-neutral-500 mb-2 leading-relaxed">
                        Paste your user or template data structure. The generator will align the exact field names (e.g., <code className="font-mono text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 px-1 rounded">user.premium</code>) in the outputs.
                      </p>
                      <textarea
                        value={jsonContext}
                        onChange={(e) => setJsonContext(e.target.value)}
                        placeholder={`{\n  "user": {\n    "premium": true,\n    "status": "active"\n  }\n}`}
                        rows={6}
                        className="w-full border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 outline-none rounded-md p-2.5 font-mono text-xs transition-colors placeholder:text-neutral-600"
                      />
                    </div>
                  )}
                </div>

                {/* Extra Options & Trigger Button */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={explain}
                      onChange={(e) => setExplain(e.target.checked)}
                      className="accent-black dark:accent-white rounded"
                    />
                    Generate tag explanation
                  </label>

                  <button
                    onClick={handleGenerate}
                    disabled={generatorLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black transition-colors disabled:opacity-50"
                  >
                    {generatorLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Generate Logic
                      </>
                    )}
                  </button>
                </div>

                {generatorError && (
                  <div className="p-3 border border-red-200/50 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-md text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{generatorError}</p>
                  </div>
                )}
              </div>

              {/* Right Output Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Generated FreeMarker Output
                  </span>

                  {generatedCode && (
                    <button
                      onClick={() => copyToClipboard(generatedCode, 'gen-output')}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-950 transition-all text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                    >
                      {copiedId === 'gen-output' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>

                {generatedCode ? (
                  <div className="space-y-4">
                    <CodeEditor value={generatedCode} onChange={setGeneratedCode} readOnly />

                    {/* Interactive Tag Explanation */}
                    {explanationText && (
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden bg-neutral-50/50 dark:bg-[#030303]/50">
                        <button
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors border-b border-neutral-200 dark:border-neutral-800"
                        >
                          <span className="flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                            Explain Generated Code
                          </span>
                          {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showExplanation && (
                          <div className="p-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-sans">
                            {explanationText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 border border-neutral-200 dark:border-neutral-800 rounded-md flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/20 dark:bg-neutral-950/20">
                    <Wand2 className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs font-mono">Run a prompt to see outputs...</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: CODE MODIFIER */}
        {activeTab === 'modifier' && (
          <div className="space-y-6">

            {/* Header info */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Code Modifier
                <Code2 className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Paste existing FreeMarker code, write instructions on how you want to refactor or update it, and view the highlighted diffs.
              </p>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">Try examples:</span>
              <button
                onClick={() => loadModifierPreset('vip')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium"
              >
                Add VIP Conditional Check
              </button>
              <button
                onClick={() => loadModifierPreset('border')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium"
              >
                Wrap in Layout Border Table
              </button>
            </div>

            {/* Input & Output Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Side: Original Code & Instructions */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Original FreeMarker Code
                  </span>
                  <CodeEditor
                    value={modifierOriginalCode}
                    onChange={setModifierOriginalCode}
                    placeholder={`Paste existing FreeMarker code here...`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modifier-instructions" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Modification Instructions
                  </label>
                  <textarea
                    id="modifier-instructions"
                    value={modifierInstructions}
                    onChange={(e) => setModifierInstructions(e.target.value)}
                    placeholder="e.g., Wrap this in a table with a border, or add a conditional statement if the user has points..."
                    rows={3}
                    className="w-full border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 outline-none rounded-md px-3 py-2 text-sm transition-colors placeholder:text-neutral-400"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleModify}
                    disabled={modifierLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black transition-colors disabled:opacity-50"
                  >
                    {modifierLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Modifying...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Apply Modifications
                      </>
                    )}
                  </button>
                </div>

                {modifierError && (
                  <div className="p-3 border border-red-200/50 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-md text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{modifierError}</p>
                  </div>
                )}
              </div>

              {/* Right Side: Diff Output */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Modified Output Diffs
                  </span>

                  {modifierModifiedCode && (
                    <button
                      onClick={() => copyToClipboard(modifierModifiedCode, 'modifier-output')}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-950 transition-all text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                    >
                      {copiedId === 'modifier-output' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Modified Code
                        </>
                      )}
                    </button>
                  )}
                </div>

                {modifierModifiedCode ? (
                  <DiffViewer oldCode={modifierOriginalCode} newCode={modifierModifiedCode} />
                ) : (
                  <div className="h-[490px] border border-neutral-200 dark:border-neutral-800 rounded-md flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/20 dark:bg-neutral-950/20">
                    <Code2 className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs font-mono">Apply instructions to view modified output diffs...</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: AUDITOR & LINTER */}
        {activeTab === 'auditor' && (
          <div className="space-y-6">

            {/* Header info */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                FreeMarker Auditor & Linter
                <ShieldAlert className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Scan your Apache FreeMarker templates for missing closing tags, null-safe errors, and email client compatibility issues.
              </p>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">Inject broken code:</span>
              <button
                onClick={() => loadAuditorPreset('syntax')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium text-red-600 dark:text-red-400"
              >
                Missing Closing Tag
              </button>
              <button
                onClick={() => loadAuditorPreset('safety')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium text-amber-600 dark:text-amber-400"
              >
                Missing Null-Safety
              </button>
              <button
                onClick={() => loadAuditorPreset('perf')}
                className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-medium text-blue-600 dark:text-blue-400"
              >
                Inline Filtering Loop
              </button>
            </div>

            {/* Audit Layout */}
            <div className="space-y-4">

              {/* Linter Editor Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Paste FreeMarker Template
                </span>

                <button
                  onClick={handleAudit}
                  disabled={auditorLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black transition-colors disabled:opacity-50"
                >
                  {auditorLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Audit Code
                    </>
                  )}
                </button>
              </div>

              {/* Linter input editor */}
              <CodeEditor
                value={auditCode}
                onChange={setAuditCode}
                placeholder={`<#if user.vip!false>\n  Hello \${user.name!"Valued Guest"}!\n</#if>`}
              />

              {auditorError && (
                <div className="p-3 border border-red-200/50 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-md text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{auditorError}</p>
                </div>
              )}

              {/* Audit Results Presentation */}
              {auditResult && (
                <div className="space-y-4 border border-neutral-200 dark:border-neutral-800 rounded-md p-5 bg-neutral-50/30 dark:bg-[#030303]/30">

                  {/* Status Banner */}
                  <div className="flex items-center gap-3">
                    {auditResult.isValid ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold">
                        {auditResult.isValid ? 'Audit Passed successfully' : 'Audit Failed - Issues Found'}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {auditResult.isValid
                          ? 'Zero syntactic issues or compiler risks detected in this template.'
                          : `Detected ${auditResult.issues.length} critical issues or warning alerts.`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Issues Listing */}
                  {!auditResult.isValid && (
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800 mt-4 pt-2">
                      {auditResult.issues.map((issue, idx) => (
                        <div key={idx} className="py-4 first:pt-2 last:pb-2 text-xs flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                          <div className="space-y-1">

                            {/* Severity Tag */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${issue.severity === 'error'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : issue.severity === 'warning'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                }`}>
                                {issue.severity}
                              </span>
                              {issue.line && (
                                <span className="text-neutral-500 font-mono text-[10px]">
                                  Line {issue.line}
                                </span>
                              )}
                            </div>

                            {/* Message & Code Suggestion */}
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 leading-normal">
                              {issue.message}
                            </p>
                            <p className="text-neutral-500 leading-normal">
                              <span className="font-semibold text-neutral-700 dark:text-neutral-400">Suggestion: </span>
                              {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
