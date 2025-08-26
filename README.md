# FormSight — Document Parser AI

**Tagline:** A focused React prototype that previews PDFs/images and extracts structured form elements (text, tables, checkboxes, signatures, selection marks, including handwritten text) into a flat JSON array with normalized bounding boxes and page references.

---

## Table of Contents

* [Project Summary](#project-summary)
* [Highlights & Capabilities](#highlights--capabilities)
* [Output Schema](#output-schema)
* [Repository Structure](#repository-structure)
* [Security Warning (IMPORTANT)](#security-warning-important)
* [Getting Started — Local Development](#getting-started--local-development)

  * [Prerequisites](#prerequisites)
  * [Install & Run (UI-only)](#install--run-ui-only)
  * [Recommended: Backend Proxy (secure)](#recommended-backend-proxy-secure)

    * [Express example (drop-in)](#express-example-drop-in)
* [Developer Notes / Implementation Details](#developer-notes--implementation-details)
* [Testing & Debugging](#testing--debugging)

---

## Project Summary

FormSight is a single-page React application that helps developers prototype document understanding pipelines. It supports uploading PDFs or images, renders a first-page preview (via `pdf.js` when available), sends a base64 representation to a parsing service, and visualizes the returned structured JSON with bounding-box overlays for quick verification.

While the UI is complete and usable, the current `services/geminiService.tsx` is written to call `@google/genai` and **must be run from a secure backend** (see Security Warning below). The shipped front-end imports the service directly, so you should follow the recommended backend proxy pattern before connecting real API keys.

---

## Highlights & Capabilities

* Drag & drop / click-to-upload for `PDF`, `PNG`, `JPG/JPEG`, `WEBP`, `GIF`.
* PDF first-page preview using `pdf.js` (configured to use CDN worker when available).
* Visual overlay of bounding boxes returned by the parser; hover a JSON item to highlight its box.
* JSON viewer that renders tables as HTML tables for easier inspection.
* Designed to accept handwritten text through OCR models (backend responsibility).

---

## Output Schema

Each extracted element must follow the `ExtractedField` TypeScript interface in `src/types.ts`:

```ts
export type FieldType = 'text' | 'checkbox' | 'table' | 'signature' | 'selectionMark';
export type FieldValue = string | 'checked' | 'unchecked' | string[][];
export interface ExtractedField {
  field_type: FieldType;
  label: string | null;
  value: FieldValue;
  box: [number, number, number, number];
  page_number: number;
}
```

The app expects a **flat JSON array** of these objects (one array covering the entire document). Example output is shown in the `examples/` section of this README.

---

## Repository Structure

```
/src
  ├─ App.tsx                  # Main UI, file selection, previews and parse orchestration
  ├─ index.tsx                # ReactDOM mount
  ├─ types.ts                 # Shared types (ExtractedField)
  ├─ services/
  │   └─ geminiService.tsx    # AI integration (currently client module — move to backend!)
  └─ components/
      ├─ Header.tsx
      ├─ FileUpload.tsx
      ├─ DocumentPreview.tsx
      ├─ JsonDisplay.tsx
      ├─ Loader.tsx
      └─ Icons.tsx
```

---

## Security Warning (IMPORTANT)

`services/geminiService.tsx` creates a `GoogleGenAI` client using `process.env.API_KEY` and is imported by the front-end. **If you keep that file in the frontend bundle and build the app with an API key available at build time, the key can end up embedded in the distributed JavaScript.**

**Do not** keep secrets in frontend code. Move `geminiService.tsx` (or at least the actual API call) to a backend service that stores the key in an environment variable on the server.

Checklist:

* [ ] Move AI/API calls to a server-side endpoint.
* [ ] Put `.env` in `.gitignore` and commit `.env.example` instead.
* [ ] Rotate any keys that were previously committed.

---

## Getting Started — Local Development

### Prerequisites

* Node.js (v16+ recommended)
* npm or yarn
* Optional: a backend runtime (Node/Express or Python/FastAPI) for the Gemini proxy

### Install & Run (UI-only)

This runs the React UI - note the AI call will fail unless you provide a backend proxy or mock `parseDocument`.

```bash
# install
npm install

# start dev server
npm run dev
# or
npm start
```

If you want to test the UI without the real AI, temporarily mock `parseDocument` in `services/geminiService.tsx`:

```ts
// services/geminiService.tsx (dev stub)
export async function parseDocument(base64Data: string, mimeType: string) {
  return [ /* small mock ExtractedField[] */ ];
}
```

### Recommended: Backend Proxy (secure)

Create a small backend that accepts `{ base64Data, mimeType }`, calls the GenAI API (or your OCR/layout pipeline), and returns the parsed `ExtractedField[]`. Below is a drop-in Node/Express example.

#### Express example (drop-in)

```js
// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(bodyParser.json({ limit: '15mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

app.post('/api/parse', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    // replicate the filePart + prompt logic from geminiService.tsx here
    const filePart = { inlineData: { data: base64Data, mimeType } };

    const prompt = `...`;// copy the prompt from src/services/geminiService.tsx

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [filePart, { text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.text);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(process.env.PORT || 4000, () => console.log('Server ready'));
```

On the client, replace direct `parseDocument` import with a fetch to `/api/parse`.

---

## Developer Notes / Implementation Details

* **PDF preview**: `App.tsx` uses `pdfjsLib` from `window` if available and renders the first page to canvas. The worker path is set to a CDN worker in the app (change as needed).
* **Coordinate mapping**: `DocumentPreview` assumes a 1000×1000 normalized coordinate system when converting `box` values into percent-based overlays. Ensure your backend normalizes coordinates consistently with this assumption or update the frontend mapping logic.
* **JSON rendering**: `JsonDisplay.tsx` provides a readable view of the returned array and renders table values as HTML tables. Hovering a JSON item highlights the corresponding bounding box.
* **Accepted MIME types**: `ACCEPTED_MIME_TYPES` is declared in `App.tsx` and enforced by `FileUpload`.

---

## Testing & Debugging

* **Manual UI tests**: Upload representative documents (invoices, filled forms, handwritten notes). Inspect the JSON and hover highlights.
* **Unit tests**: Add tests for coordinate transforms and for any backend normalization functions.
* **AI response robustness**: Generative models occasionally return preambles or malformed JSON. Build server-side validation and sanitization to avoid client crashes.

---

## Example: Minimal Request/Response

**Request (POST /api/parse)**

```json
{ "base64Data": "<base64>", "mimeType": "application/pdf" }
```

**Response (200 OK)**

```json
[
  {"field_type":"text","label":"Invoice No","value":"INV-001","box":[48,72,312,98],"page_number":1},
  {"field_type":"checkbox","label":"Rush","value":"checked","box":[48,420,62,434],"page_number":1}
]
```

---

