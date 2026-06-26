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
  Code2,
  Zap,
  Database
} from 'lucide-react';

// ─── Background Orbs Component ─────────────────────────────
function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Dot grid */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Floating orbs */}
      <div
        className="orb-1 absolute rounded-full blur-3xl"
        style={{
          width: '55vw',
          height: '55vw',
          maxWidth: 700,
          maxHeight: 700,
          top: '-15%',
          right: '-10%',
          background: 'var(--orb-1)',
        }}
      />
      <div
        className="orb-2 absolute rounded-full blur-3xl"
        style={{
          width: '40vw',
          height: '40vw',
          maxWidth: 550,
          maxHeight: 550,
          bottom: '-10%',
          left: '5%',
          background: 'var(--orb-2)',
        }}
      />
      <div
        className="orb-3 absolute rounded-full blur-3xl"
        style={{
          width: '30vw',
          height: '30vw',
          maxWidth: 400,
          maxHeight: 400,
          top: '40%',
          left: '35%',
          background: 'var(--orb-3)',
        }}
      />
    </div>
  );
}

// ─── Custom Code Editor ─────────────────────────────────────
interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  wrap?: boolean;
}

function CodeEditor({ value, onChange, placeholder, readOnly = false, wrap = false }: CodeEditorProps) {
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
    <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-[#080808] font-mono text-sm leading-6 overflow-hidden h-72 md:h-96 relative transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 focus-within:border-neutral-400 dark:focus-within:border-neutral-600 focus-within:shadow-sm">
      {/* Line Numbers */}
      {!wrap && (
        <div
          ref={lineNumbersRef}
          className="select-none text-right pr-3 pl-2 py-3 bg-neutral-100/60 dark:bg-[#030303]/70 text-neutral-400 dark:text-neutral-700 border-r border-neutral-200 dark:border-neutral-800 text-xs min-w-[2.5rem] overflow-y-hidden scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {lines.map((num) => (
            <div key={num} className="h-6">{num}</div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        wrap={wrap ? 'on' : 'off'}
        className={`flex-1 p-3 bg-transparent text-neutral-900 dark:text-neutral-100 outline-none resize-none font-mono text-sm leading-6 h-full min-w-0 placeholder:text-neutral-400 dark:placeholder:text-neutral-700 ${wrap ? 'whitespace-pre-wrap overflow-y-auto' : 'whitespace-pre overflow-auto'
          }`}
      />
    </div>
  );
}

// ─── Diff Engine ───────────────────────────────────────────
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
      result.unshift({ type: 'unchanged', value: oldLines[i - 1], oldLineNum: i, newLineNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newLines[j - 1], newLineNum: j });
      j--;
    } else {
      result.unshift({ type: 'removed', value: oldLines[i - 1], oldLineNum: i });
      i--;
    }
  }
  return result;
}

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  wrap?: boolean;
}

function DiffViewer({ oldCode, newCode, wrap = false }: DiffViewerProps) {
  const diffs = calculateDiff(oldCode, newCode);
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-[#080808] font-mono text-sm leading-6 overflow-hidden h-[360px] md:h-[490px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-[#050505]/80 text-xs font-semibold text-neutral-500 select-none">
        <span className="font-mono tracking-wide">Inline Diff View</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/30 rounded" />
            Removed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-500/20 border border-green-500/30 rounded" />
            Added
          </span>
        </div>
      </div>
      <div className={`flex-1 p-3 select-text ${wrap ? 'overflow-y-auto' : 'overflow-auto'}`}>
        <table className="w-full border-collapse">
          <tbody>
            {diffs.map((diff, index) => {
              let rowBg = '';
              let prefix = ' ';
              let prefixColor = 'text-neutral-400';
              let textColor = 'text-neutral-900 dark:text-neutral-100';

              if (diff.type === 'added') {
                rowBg = 'bg-green-500/8 dark:bg-green-950/25';
                prefix = '+'; prefixColor = 'text-green-500 font-bold';
                textColor = 'text-green-700 dark:text-green-300';
              } else if (diff.type === 'removed') {
                rowBg = 'bg-red-500/8 dark:bg-red-950/25';
                prefix = '-'; prefixColor = 'text-red-500 font-bold';
                textColor = 'text-red-700 dark:text-red-300';
              }

              return (
                <tr key={index} className={`min-h-[1.5rem] ${rowBg} hover:brightness-95 dark:hover:brightness-110 transition-all duration-100`}>
                  <td className="w-10 text-right pr-3 select-none text-neutral-400 dark:text-neutral-600 text-xs border-r border-neutral-200 dark:border-neutral-800 pl-1 align-top pt-0.5">{diff.oldLineNum || ''}</td>
                  <td className="w-10 text-right pr-3 select-none text-neutral-400 dark:text-neutral-600 text-xs border-r border-neutral-200 dark:border-neutral-800 pl-1 align-top pt-0.5">{diff.newLineNum || ''}</td>
                  <td className={`w-6 text-center select-none font-bold text-sm align-top pt-0.5 ${prefixColor}`}>{prefix}</td>
                  <td className={`pl-2 font-mono text-sm leading-6 align-middle ${textColor} ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>{diff.value || ' '}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Preset Chip ───────────────────────────────────────────
function PresetChip({ onClick, children, variant = 'default' }: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'warning' | 'info';
}) {
  const variantClass = {
    default: 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-900 dark:hover:text-neutral-100',
    error: 'border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 hover:border-red-400/60 dark:hover:border-red-700/60 hover:bg-red-50 dark:hover:bg-red-950/20',
    warning: 'border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 hover:border-amber-400/60 dark:hover:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/20',
    info: 'border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 hover:border-blue-400/60 dark:hover:border-blue-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/20',
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs border rounded-lg font-medium active:scale-95 transition-all duration-200 hover:-translate-y-0.5 shrink-0 ${variantClass}`}
    >
      {children}
    </button>
  );
}

// ─── Section Card ──────────────────────────────────────────
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/70 dark:bg-neutral-950/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

// ─── Action Button ─────────────────────────────────────────
function ActionButton({ onClick, disabled, loading, loadingText, icon, children }: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black active:scale-95 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 disabled:translate-y-0 disabled:shadow-none"
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
          {children}
        </>
      )}
    </button>
  );
}

// ─── Empty State ───────────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="h-72 md:h-96 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/30 dark:bg-neutral-950/20 gap-3 transition-all duration-300 group hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="w-12 h-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-white/80 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-600 animate-pulse-slow group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-mono text-neutral-400 dark:text-neutral-600">{title}</p>
        {subtitle && <p className="text-[10px] text-neutral-400/60 dark:text-neutral-700 font-mono">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Label ─────────────────────────────────────────────────
function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider"
    >
      {children}
    </label>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<'generator' | 'modifier' | 'auditor'>('generator');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab 1: Logic Generator
  const [prompt, setPrompt] = useState('');
  const [jsonContext, setJsonContext] = useState('');
  const [explain, setExplain] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState('');
  const [wrapOutput, setWrapOutput] = useState(true);

  // Tab 2: Code Modifier
  const [modifierOriginalCode, setModifierOriginalCode] = useState('');
  const [modifierInstructions, setModifierInstructions] = useState('');
  const [modifierModifiedCode, setModifierModifiedCode] = useState('');
  const [modifierLoading, setModifierLoading] = useState(false);
  const [modifierError, setModifierError] = useState('');
  const [wrapModifier, setWrapModifier] = useState(true);

  // Tab 3: Auditor
  const [auditCode, setAuditCode] = useState('');
  type AuditIssue = { severity: 'error' | 'warning' | 'info'; line?: number; message: string; suggestion: string };
  const [auditResult, setAuditResult] = useState<{ isValid: boolean; issues: AuditIssue[] } | null>(null);
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [auditorError, setAuditorError] = useState('');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'audit', code: '<#-- Ping -- >' }),
    })
      .then((res) => res.json())
      .then((data) => setIsMockMode(!!data.isMock))
      .catch(() => setIsMockMode(true));
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

  const loadGeneratorPreset = (type: 'promo' | 'cart') => {
    if (type === 'promo') {
      setPrompt('If the user is VIP, render a golden promo banner with code "GOLDVIP". If they are premium, show code "PREMIUM10". Otherwise, display a standard signup link.');
      setJsonContext(JSON.stringify({ user: { tier: 'VIP', name: 'Alex Mercer' } }, null, 2));
      setIsContextCollapsed(false);
    } else {
      setPrompt('Loop through the active items array. For each item, display name, category, and price formatted as currency. If active is false, skip the item. If the array is empty, output a "No items found" message.');
      setJsonContext(JSON.stringify({
        items: [
          { name: 'Leather Notebook', category: 'Office', price: 24.99, active: true },
          { name: 'Steel Water Bottle', category: 'Lifestyle', price: 35.00, active: true },
          { name: 'Bluetooth Speaker', category: 'Tech', price: 89.95, active: false },
        ],
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

  const handleGenerate = async () => {
    if (!prompt.trim()) { setGeneratorError('Please enter a natural language request.'); return; }
    setGeneratorLoading(true);
    setGeneratorError('');
    setGeneratedCode('');
    setExplanationText('');

    let parsedContext = null;
    if (jsonContext.trim()) {
      try { parsedContext = JSON.parse(jsonContext); }
      catch {
        setGeneratorError('Invalid JSON in Sample Context. Please verify your formatting.');
        setGeneratorLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate', prompt, context: parsedContext, explain }),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedCode(data.code || '');
      setExplanationText(data.explanation || '');
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      setGeneratorError(err instanceof Error ? err.message : 'An error occurred during code generation.');
    } finally {
      setGeneratorLoading(false);
    }
  };

  const handleModify = async () => {
    if (!modifierOriginalCode.trim()) { setModifierError('Please enter the original code to modify.'); return; }
    if (!modifierInstructions.trim()) { setModifierError('Please enter modification instructions.'); return; }
    setModifierLoading(true);
    setModifierError('');
    setModifierModifiedCode('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'modify', code: modifierOriginalCode, instructions: modifierInstructions }),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setModifierModifiedCode(data.code || '');
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      setModifierError(err instanceof Error ? err.message : 'An error occurred during code modification.');
    } finally {
      setModifierLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!auditCode.trim()) { setAuditorError('Please enter FreeMarker code to audit.'); return; }
    setAuditorLoading(true);
    setAuditorError('');
    setAuditResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'audit', code: auditCode }),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAuditResult({ isValid: data.isValid, issues: data.issues || [] });
      setIsMockMode(!!data.isMock);
    } catch (err: unknown) {
      setAuditorError(err instanceof Error ? err.message : 'An error occurred during auditing.');
    } finally {
      setAuditorLoading(false);
    }
  };

  // Wrap toggle button helper
  const WrapToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-lg transition-all duration-200 active:scale-95 hover:-translate-y-0.5 font-medium ${value
        ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-black'
        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
    >
      Wrap
    </button>
  );

  // Copy button helper
  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 active:scale-95 hover:-translate-y-0.5 font-medium"
    >
      {copiedId === id ? (
        <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 dark:text-green-400">Copied!</span></>
      ) : (
        <><Copy className="w-3.5 h-3.5" />Copy</>
      )}
    </button>
  );

  const navItems = [
    { id: 'generator', label: 'Logic Generator', icon: <Wand2 className="w-4 h-4 shrink-0" /> },
    { id: 'modifier', label: 'Code Modifier', icon: <Code2 className="w-4 h-4 shrink-0" /> },
    { id: 'auditor', label: 'Auditor & Linter', icon: <ShieldAlert className="w-4 h-4 shrink-0" /> },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-50 transition-colors duration-200 relative">
      <BackgroundCanvas />

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="relative z-10 w-full md:w-60 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 flex flex-col p-4 md:p-5 shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-md gap-3 md:gap-0">

        {/* Brand + mobile theme */}
        <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start mb-2 md:mb-8 w-full gap-4">
          <div className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-md">
              <span className="text-white dark:text-black font-mono font-bold text-xs tracking-tighter">qm</span>
            </div>
            <div className="flex flex-col gap-0">
              <h1 className="text-sm font-bold tracking-tight leading-none">quickmarker</h1>

            </div>
          </div>

          {/* Mobile theme toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 active:scale-90 transition-all duration-200 hover:rotate-12"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none whitespace-nowrap w-full md:flex-1">
          {navItems.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-slide-left flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 active:scale-95 relative overflow-hidden ${isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
                  }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/40 dark:bg-black/30 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer (desktop) */}
        <div className="hidden md:flex flex-col mt-auto pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 active:scale-95 transition-all duration-200 hover:rotate-12"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {isMockMode && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 animate-pop-in">
              <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Sandbox mode — no API key detected.
              </p>
            </div>
          )}

          <div className="text-[9px] text-neutral-400 dark:text-neutral-700 font-mono tracking-widest uppercase">
            2026 · Vijay Dhyani
          </div>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 md:p-10 max-w-5xl overflow-y-auto">

        {/* ── TAB 1: LOGIC GENERATOR ──────────────────────────── */}
        {activeTab === 'generator' && (
          <div className="space-y-6 tab-content-enter">

            {/* Page header */}
            <div className="space-y-1.5 animate-fade-in">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                Logic Generator
                <Sparkles className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed max-w-lg">
                Generate error-free FreeMarker code using natural language requests. The AI understands your data structure and logic requirements instantly.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              <span className="text-xs text-neutral-400 dark:text-neutral-600 shrink-0 font-mono uppercase tracking-wider">Examples</span>
              <PresetChip onClick={() => loadGeneratorPreset('promo')}>Promo Announcement</PresetChip>
              <PresetChip onClick={() => loadGeneratorPreset('cart')}>Abandoned Cart Loop</PresetChip>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Input panel */}
              <div className="space-y-4 animate-slide-left">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="prompt">Natural Language Request</FieldLabel>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., If user is a subscriber and has premium status, show the active voucher, otherwise show a subscribe button..."
                    rows={5}
                    className="w-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/60 text-neutral-900 dark:text-neutral-100 focus:border-neutral-400 dark:focus:border-neutral-600 outline-none rounded-xl px-3.5 py-3 text-sm transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-700 focus:shadow-sm resize-none"
                  />
                </div>

                {/* JSON Context collapsible */}
                <SectionCard>
                  <button
                    onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                      <span>Sample JSON Context <span className="text-neutral-400 font-normal">(Optional)</span></span>
                    </div>
                    <div className={`transition-transform duration-200 ${isContextCollapsed ? '' : 'rotate-180'}`}>
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    </div>
                  </button>

                  {!isContextCollapsed && (
                    <div className="px-4 pb-4 space-y-2 animate-fade-in border-t border-neutral-100 dark:border-neutral-800/50 pt-3">
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Paste your data structure. The generator will align field names (e.g., <code className="font-mono text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">user.premium</code>) in the output.
                      </p>
                      <textarea
                        value={jsonContext}
                        onChange={(e) => setJsonContext(e.target.value)}
                        placeholder={`{\n  "user": {\n    "premium": true,\n    "status": "active"\n  }\n}`}
                        rows={6}
                        className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:border-neutral-400 dark:focus:border-neutral-600 outline-none rounded-lg p-3 font-mono text-xs transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-700 resize-none"
                      />
                    </div>
                  )}
                </SectionCard>

                {/* Options + trigger */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={explain}
                        onChange={(e) => setExplain(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${explain ? 'bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white' : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400'}`}>
                        {explain && <Check className="w-3 h-3 text-white dark:text-black" />}
                      </div>
                    </div>
                    <span className="group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">Generate tag explanation</span>
                  </label>

                  <ActionButton
                    onClick={handleGenerate}
                    loading={generatorLoading}
                    loadingText="Generating..."
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
                  >
                    Generate Logic
                  </ActionButton>
                </div>

                {generatorError && (
                  <div className="p-3.5 border border-red-200/60 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{generatorError}</p>
                  </div>
                )}
              </div>

              {/* Output panel */}
              <div className="space-y-4 animate-slide-right">
                <div className="flex items-center justify-between">
                  <FieldLabel>Generated FreeMarker Output</FieldLabel>
                  <div className="flex items-center gap-2">
                    <WrapToggle value={wrapOutput} onChange={() => setWrapOutput(!wrapOutput)} />
                    {generatedCode && <CopyButton text={generatedCode} id="gen-output" />}
                  </div>
                </div>

                {generatedCode ? (
                  <div className="space-y-4 animate-fade-in">
                    <CodeEditor value={generatedCode} onChange={setGeneratedCode} readOnly wrap={wrapOutput} />

                    {explanationText && (
                      <SectionCard>
                        <button
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors rounded-xl"
                        >
                          <span className="flex items-center gap-2">
                            <Info className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                            Explain Generated Code
                          </span>
                          <div className={`transition-transform duration-200 ${showExplanation ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          </div>
                        </button>
                        {showExplanation && (
                          <div className="px-4 pb-4 pt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-sans animate-fade-in border-t border-neutral-100 dark:border-neutral-800/50">
                            {explanationText}
                          </div>
                        )}
                      </SectionCard>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Wand2 className="w-5 h-5" />}
                    title="See code here..."
                    subtitle="Your generated logic will appear here"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CODE MODIFIER ─────────────────────────────── */}
        {activeTab === 'modifier' && (
          <div className="space-y-6 tab-content-enter">
            <div className="space-y-1.5 animate-fade-in">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                Code Modifier
                <Code2 className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed max-w-lg">
                Paste existing FreeMarker code, write instructions on how you want to refactor or update it, and view highlighted diffs.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              <span className="text-xs text-neutral-400 dark:text-neutral-600 shrink-0 font-mono uppercase tracking-wider">Examples</span>
              <PresetChip onClick={() => loadModifierPreset('vip')}>Add VIP Conditional Check</PresetChip>
              <PresetChip onClick={() => loadModifierPreset('border')}>Wrap in Layout Border Table</PresetChip>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Input */}
              <div className="space-y-4 animate-slide-left">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Original FreeMarker Code</FieldLabel>
                    <WrapToggle value={wrapModifier} onChange={() => setWrapModifier(!wrapModifier)} />
                  </div>
                  <CodeEditor value={modifierOriginalCode} onChange={setModifierOriginalCode} placeholder="Paste existing FreeMarker code here..." wrap={wrapModifier} />
                </div>

                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="modifier-instructions">Modification Instructions</FieldLabel>
                  <textarea
                    id="modifier-instructions"
                    value={modifierInstructions}
                    onChange={(e) => setModifierInstructions(e.target.value)}
                    placeholder="e.g., Wrap this in a table with a border, or add a conditional statement if the user has points..."
                    rows={4}
                    className="w-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/60 text-neutral-900 dark:text-neutral-100 focus:border-neutral-400 dark:focus:border-neutral-600 outline-none rounded-xl px-3.5 py-3 text-sm transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-700 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <ActionButton
                    onClick={handleModify}
                    loading={modifierLoading}
                    loadingText="Modifying..."
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
                  >
                    Apply Modifications
                  </ActionButton>
                </div>

                {modifierError && (
                  <div className="p-3.5 border border-red-200/60 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{modifierError}</p>
                  </div>
                )}
              </div>

              {/* Output */}
              <div className="space-y-4 animate-slide-right">
                <div className="flex items-center justify-between">
                  <FieldLabel>Modified Output Diffs</FieldLabel>
                  <div className="flex items-center gap-2">
                    <WrapToggle value={wrapModifier} onChange={() => setWrapModifier(!wrapModifier)} />
                    {modifierModifiedCode && <CopyButton text={modifierModifiedCode} id="modifier-output" />}
                  </div>
                </div>

                {modifierModifiedCode ? (
                  <div className="animate-fade-in">
                    <DiffViewer oldCode={modifierOriginalCode} newCode={modifierModifiedCode} wrap={wrapModifier} />
                  </div>
                ) : (
                  <div className="h-[360px] md:h-[490px] border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-50/30 dark:bg-neutral-950/20 gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-white/80 dark:bg-neutral-900/50 animate-pulse-slow group-hover:scale-105 transition-transform duration-300">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-mono">Apply instructions to view diffs...</p>
                      <p className="text-[10px] text-neutral-400/60 dark:text-neutral-700 font-mono">Changes will be highlighted inline</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: AUDITOR & LINTER ─────────────────────────── */}
        {activeTab === 'auditor' && (
          <div className="space-y-6 tab-content-enter">
            <div className="space-y-1.5 animate-fade-in">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                FreeMarker Auditor & Linter
                <ShieldAlert className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed max-w-lg">
                Scan your Apache FreeMarker templates for missing closing tags, null-safe errors, and email client compatibility issues.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              <span className="text-xs text-neutral-400 dark:text-neutral-600 shrink-0 font-mono uppercase tracking-wider">Inject broken code</span>
              <PresetChip onClick={() => loadAuditorPreset('syntax')} variant="error">Missing Closing Tag</PresetChip>
              <PresetChip onClick={() => loadAuditorPreset('safety')} variant="warning">Missing Null-Safety</PresetChip>
              <PresetChip onClick={() => loadAuditorPreset('perf')} variant="info">Inline Filtering Loop</PresetChip>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FieldLabel>Paste FreeMarker Template</FieldLabel>
                <ActionButton
                  onClick={handleAudit}
                  loading={auditorLoading}
                  loadingText="Auditing..."
                  icon={<ShieldAlert className="w-4 h-4" />}
                >
                  Audit Code
                </ActionButton>
              </div>

              <CodeEditor value={auditCode} onChange={setAuditCode} placeholder={`<#if user.vip!false>\n  Hello \${user.name!"Valued Guest"}!\n</#if>`} />

              {auditorError && (
                <div className="p-3.5 border border-red-200/60 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{auditorError}</p>
                </div>
              )}

              {/* Audit results */}
              {auditResult && (
                <SectionCard className="animate-fade-in-up">
                  <div className="p-5 space-y-4">
                    {/* Status banner */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${auditResult.isValid
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                        }`}>
                        {auditResult.isValid
                          ? <CheckCircle2 className="w-5 h-5" />
                          : <AlertTriangle className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">
                          {auditResult.isValid ? 'Audit Passed Successfully' : 'Audit Failed — Issues Found'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {auditResult.isValid
                            ? 'Zero syntactic issues or compiler risks detected in this template.'
                            : `Detected ${auditResult.issues.length} critical issue${auditResult.issues.length !== 1 ? 's' : ''} or warning alert${auditResult.issues.length !== 1 ? 's' : ''}.`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Issues list */}
                    {!auditResult.isValid && (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 border-t border-neutral-100 dark:border-neutral-800/60 mt-2">
                        {auditResult.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className="py-4 first:pt-3 last:pb-1 text-xs flex flex-col gap-2 animate-fade-in"
                            style={{ animationDelay: `${idx * 60}ms` }}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${issue.severity === 'error'
                                ? 'bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20'
                                : issue.severity === 'warning'
                                  ? 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                }`}>
                                {issue.severity}
                              </span>
                              {issue.line && (
                                <span className="text-neutral-400 font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                  Line {issue.line}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 leading-normal">{issue.message}</p>
                            <p className="text-neutral-500 leading-relaxed">
                              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Suggestion: </span>
                              {issue.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        )}

        {/* Mobile footer */}
        <footer className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-2 md:hidden">
          <div className="text-[9px] text-neutral-400 dark:text-neutral-600 font-mono tracking-widest uppercase">
            2026 · Vijay Dhyani
          </div>
          {isMockMode && (
            <p className="text-[10px] text-neutral-500 leading-normal text-center">
              No API Key detected. Currently falling back to sandbox outputs.
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}
