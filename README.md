<div align="center">

<br />

```
  ██████╗ ███╗   ███╗
 ██╔═══██╗████╗ ████║
 ██║   ██║██╔████╔██║
 ██║▄▄ ██║██║╚██╔╝██║
 ╚██████╔╝██║ ╚═╝ ██║
  ╚══▀▀═╝ ╚═╝     ╚═╝
```

# quickmarker &nbsp;`BETA`

**An AI-powered playground for writing, refactoring, auditing, and previewing Apache FreeMarker HTML email templates.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vertex AI](https://img.shields.io/badge/Vertex_AI-gemini--2.5--flash-4285f4?style=flat-square&logo=googlecloud)](https://cloud.google.com/vertex-ai)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-Deployed-4285f4?style=flat-square&logo=googlecloud)](https://cloud.google.com/run)

<br />

> *A fun weekend project that turned into building a custom DP diff engine, a zero-dependency FTL syntax highlighter, and a structured AI rendering pipeline.*

</div>

---

## ✨ What is quickmarker?

If you've ever written **Apache FreeMarker (FTL)** templates for high-throughput HTML emails, you know how fragile they can be. A single null-pointer exception on a nested path, or a missing `</#if>` tag, can silently crash your entire email rendering pipeline.

**quickmarker** is a developer tool and playground designed to solve four problems:

1. **Generation** — Translate natural language into valid, null-safe FreeMarker code in seconds
2. **Modification** — Refactor existing templates with AI instructions, with a visual diff of every change
3. **Auditing** — Statically scan templates for bugs, missing fallbacks, and performance issues
4. **Preview** — Simulate what the rendered HTML output actually looks like for a given data context

---

## 🚀 Features

### ⚡ Logic Generator

Describe what you want in plain English — the AI compiles it into production-ready FreeMarker logic.

- Enforces **parent-safe null handling**: `((user.name)!"Valued Customer")` so templates never crash if a parent object is missing
- Forces **table-based HTML layouts** (`<table>`, `<tr>`, `<td>`) for cross-client email compatibility — never `<div>`
- Accepts a **JSON context** or a built-in **spreadsheet grid** to map your actual variable names into the output
- Optionally generates a **step-by-step tag explanation** you can toggle open

### 🔄 Code Modifier

Paste existing FTL code, describe your changes in natural language, and see every line-level difference.

- Powered by a **custom LCS diff engine** (no external dependencies)
- Built-in **inline diff viewer** with red (removed) / green (added) line highlighting
- Full line-number tracking on both old and new versions

### 🛡️ Auditor & Linter

Paste any FreeMarker snippet and scan it for:

| Issue Type | Example |
|---|---|
| **Syntax errors** | Missing `</#if>` or `</#list>` closing tags |
| **Null-safety crashes** | `${user.name}` without a `!` fallback operator |
| **Performance bottlenecks** | Inline `?filter(...)` calls inside `<#list>` loops |

Each issue surfaces with a `severity` badge (`error` / `warning` / `info`), an optional line number, and a concrete code suggestion.

### 👁️ Preview Output

See what your template actually renders — without a Java FreeMarker server.

- Sends the generated code + your data context to Gemini, which simulates the FreeMarker runtime and returns the rendered HTML
- **Rendered tab**: shows the output in a sandboxed `<iframe>` with a browser-chrome mockup
- **Raw HTML tab**: copyable rendered source
- Runtime notes surface fallback values used, missing variables, and which conditional branches were taken

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Route Handlers) |
| **UI** | React 19, Tailwind CSS v4, Lucide React |
| **AI** | Google Vertex AI — `gemini-2.5-flash` via `@google/genai` v2 |
| **Language** | TypeScript 5 (strict, end-to-end typed) |
| **Hosting** | Google Cloud Run (via Cloud Buildpacks — no Dockerfile needed) |

---

## 🔬 Architecture Highlights

### Structured AI Outputs

Instead of parsing brittle markdown code blocks from the model, every AI call uses `responseMimeType: 'application/json'` with a `responseSchema` constraint. This enforces strict type compliance directly in the model response — the API returns a typed JSON object in a single shot, never wrapped in fences.

```ts
config: {
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'OBJECT',
    properties: {
      code:        { type: 'STRING' },
      explanation: { type: 'STRING' }
    },
    required: ['code']
  }
}
```

### Custom LCS Diff Engine

The Code Modifier's diff viewer is built from scratch using a **Longest Common Subsequence (LCS) dynamic programming algorithm** — no external diff library required. It:

- Builds an `(m+1) × (n+1)` DP table to find the longest common subsequence of lines
- Backtracks to reconstruct `added` / `removed` / `unchanged` line segments
- Normalises trailing empty lines before diffing to eliminate phantom diff lines

### Zero-Dependency Syntax Highlighter

The code editor uses a custom **character-by-character FTL tokeniser** with a CSS overlay pattern — zero external packages:

- A `<pre>` with coloured `<span>` tokens sits absolutely positioned behind a `<textarea>`
- The `<textarea>` has `color: transparent` and `caretColor: var(--editor-caret)` — users see the highlighted version, but interact with the native textarea
- Scroll is perfectly synced across all three layers: line numbers, `<pre>`, and `<textarea>`

**Token palette (dark mode):**

| Token | Colour | Examples |
|---|---|---|
| FTL directives | 🔵 `#60a5fa` blue | `<#if>`, `</#list>`, `<#assign>` |
| FTL interpolations | 🟡 `#fbbf24` amber | `${user.name!"fallback"}` |
| HTML tags | 🟢 `#4ade80` green | `<table>`, `<td>`, `<tr>` |
| Attribute names | 🩵 `#7dd3fc` sky | `border`, `style`, `width` |
| Attribute values | 🟠 `#fb923c` orange | `"100%"`, `"padding: 10px"` |
| FTL comments | ⬜ `#4b5563` gray italic | `<#-- comment -->` |

### Spreadsheet Context Input

As an alternative to raw JSON, a 6×6 editable grid lets you paste tabular data directly:

- Row 0 is the header row — column names become JSON keys
- **Single data row** → flat `{}` object
- **Multiple data rows** → `{ "data": [{...}, {...}] }` array
- Keyboard navigation via Tab / Arrow keys
- Converts to JSON live with a real-time preview below the grid

### Sandbox / Mock Mode

If no AI credentials are configured, the app falls back to a fully functional **mock sandbox** that simulates all modes with realistic FreeMarker outputs. No API key needed to explore the UI.

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v20.6 or higher
- **npm**
- A Google Cloud project with Vertex AI enabled **or** a Gemini Developer API key

### 1. Clone & Install

```bash
git clone https://github.com/dhyanivj/quickmarker.git
cd quickmarker
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Option A: Vertex AI (GCP) ──────────────────────────────
GOOGLE_APPLICATION_CREDENTIALS="/path/to/application_default_credentials.json"
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GOOGLE_CLOUD_LOCATION="us-east4"

# ── Option B: Gemini Developer API Key ─────────────────────
VERTEX_AI_API_KEY="your-gemini-api-key"
```

> **Note:** If neither variable is set, the app runs in **Sandbox Mode** with mock responses — fully usable for UI exploration.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Google Cloud Run

Deploy to a serverless Cloud Run instance using **Google Cloud Buildpacks** — no Dockerfile required.

```bash
gcloud run deploy quickmarker \
  --source . \
  --project YOUR_PROJECT_ID \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-east4
```

Or use the pre-configured npm script (update the project ID in `package.json` first):

```bash
npm run deploy
```

---

## 📁 Project Structure

```
quickmarker/
├── src/
│   └── app/
│       ├── page.tsx            # Full UI — Generator, Modifier, Auditor, Preview
│       ├── layout.tsx          # Root layout, theme initialisation
│       ├── globals.css         # Design system, animations, FTL token colours
│       └── api/
│           └── generate/
│               └── route.ts    # AI route handler (generate/modify/audit/preview)
├── public/                     # Static assets
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔑 API Reference

### `POST /api/generate`

| `mode` | Input | Response |
|---|---|---|
| `generate` | `{ prompt, context?, explain? }` | `{ code, explanation? }` |
| `modify` | `{ code, instructions }` | `{ code }` |
| `audit` | `{ code }` | `{ isValid, issues[] }` |
| `preview` | `{ code, context? }` | `{ html, notes? }` |

#### Audit Issue Schema

```ts
{
  severity:   'error' | 'warning' | 'info';
  line?:      number;
  message:    string;
  suggestion: string;
}
```

---

## 🤖 AI System Prompt Design

Each mode uses a carefully crafted system prompt. Core rules baked into every prompt:

- **Parent-safe null checks**: Always `((user.name)!"fallback")` — never `user.name!"fallback"` — to protect against missing parent objects
- **Table-only layouts**: All HTML structure must use `<table>` / `<tr>` / `<td>` for cross-email-client compatibility
- **Closed directives**: Every `<#if>` paired with `</#if>`, every `<#list>` with `</#list>`
- **No markdown fences**: Responses are enforced as raw JSON via `responseSchema` — no string parsing required

---

## 📄 License

MIT — built for fun, for free.

---

<div align="center">

**Built with ☕ over a weekend &nbsp;·&nbsp; 2026 · Vijay Dhyani**

[GitHub](https://github.com/dhyanivj/quickmarker)

</div>
