# quickmarker

An AI-powered developer environment for writing, refactoring, and auditing Apache FreeMarker templates optimized for HTML emails.

Designed with a sleek Vercel-inspired monochrome theme.

## Features

- **Logic Generator:** Type natural language requests (e.g., "If the user is VIP, render a golden promo banner...") and instantly compile them into valid, parent-safe, cross-client HTML email tables. Includes togglable tag explanations.
- **Code Modifier:** Paste existing FreeMarker templates and write natural language instructions to modify, wrap, or refactor them. Includes a custom, lightweight, line-by-line inline diff viewer that highlights removed lines (red) and newly generated lines (green).
- **Auditor & Linter:** Paste templates to scan for syntactic errors (like missing closing tags `</#if>` or `</#list>`), potential null-safety crashes (missing path fallback parenting like `(user.name)!"fallback"`), or performance bottlenecks (such as nesting arrays inline inside loops).
- **Vertex AI Support:** Natively connects to GCP's Vertex AI (`gemini-2.5-flash`) using the unified `@google/genai` SDK, falling back to a mock sandbox if no credentials are configured.

---

## Getting Started

### Prerequisites

- Node.js v20.6+ or higher
- npm

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/dhyanivj/quickmarker.git
   cd quickmarker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your local environment variables in a `.env.local` file:
   ```env
   # Vertex AI Configuration
   GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/application_default_credentials.json"
   GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
   GOOGLE_CLOUD_LOCATION="us-east4"
   
   # Or Developer Key (Gemini API)
   VERTEX_AI_API_KEY="your-gemini-developer-api-key"
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To compile and verify the Next.js production build:
```bash
npm run build
```

---

## Deploying to Google Cloud Run

Deploy this suite to Google Cloud Run serverless using Google Cloud Buildpacks (no Dockerfile required):

```bash
gcloud run deploy quickmarker \
  --source . \
  --project YOUR_PROJECT_ID \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-east4
```

---

## Author

- **Vijay Dhyani** (2026)
