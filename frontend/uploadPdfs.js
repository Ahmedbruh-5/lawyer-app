/**
 * Upload PDFs to Gemini File API (run once), then paste printed URIs into AdvokateChat.jsx.
 *
 * From the `frontend` folder:
 *   node uploadPdfs.js
 *
 * Or: npm run upload-pdfs
 *
 * Requires `VITE_GEMINI_API_KEY` in `frontend/.env`.
 * PDF paths below are resolved under `src/components/chat/` (where your PDFs live).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const PDF_ROOT = path.join(__dirname, "src/components/chat");

const PDF_FILES = [
  { file: "CodeofCivil.pdf", displayName: "Pakistan Code of Civil Procedure" },
  {
    file: "CodeofCriminalProcedure.pdf",
    displayName: "Code of Criminal Procedure 1898",
  },
  { file: "MFLO1961.pdf", displayName: "Muslim Family Laws Ordinance 1961" },
  {
    file: "ThePunjabCriminalProsecution.pdf",
    displayName: "The Punjab Criminal Prosecution Service Act 2018",
  },
  { file: "Laws.pdf", displayName: "Pakistan Laws" },
  { file: "PakistanPenalCode.pdf", displayName: "Pakistan Penal Code" },
  {
    file: "Constitutionof1973.doc.pdf",
    displayName: "Constitution of Pakistan 1973",
  },
  {
    file: "General-Clauses-Act-1897.pdf",
    displayName: "General Clauses Act 1897",
  },
  {
    file: "qanun-e-shahadat-order-1984.pdf",
    displayName: "Qanun-e-Shahadat Order 1984",
  },
];

/**
 * Gemini File API does not accept base64 inside JSON. Use resumable upload:
 * https://ai.google.dev/gemini-api/docs/files
 */
async function uploadFile({ file, displayName }) {
  const absPath = path.join(PDF_ROOT, file);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ Missing file (skipped): ${absPath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(absPath);
  const numBytes = fileBuffer.length;
  const mimeType = "application/pdf";

  const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`;

  const startRes = await fetch(startUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(numBytes),
      "X-Goog-Upload-Header-Content-Type": mimeType,
    },
    body: JSON.stringify({
      file: { display_name: displayName },
    }),
  });

  if (!startRes.ok) {
    let errBody;
    try {
      errBody = await startRes.json();
    } catch {
      errBody = await startRes.text();
    }
    console.error(`❌ Start upload failed (${displayName}):`, errBody);
    return null;
  }

  const uploadUrl =
    startRes.headers.get("x-goog-upload-url") ||
    startRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    console.error(
      `❌ No X-Goog-Upload-URL for ${displayName}. Headers:`,
      Object.fromEntries(startRes.headers.entries())
    );
    return null;
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(numBytes),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileBuffer,
  });

  const data = await putRes.json().catch(() => ({}));
  if (!putRes.ok) {
    console.error(`❌ Upload finalize failed (${displayName}):`, data);
    return null;
  }

  if (data?.file?.uri) {
    console.log(`✅ ${displayName}`);
    console.log(`   URI: ${data.file.uri}\n`);
    return data.file.uri;
  }
  console.error(`❌ Unexpected response for ${displayName}:`, data);
  return null;
}

const env = loadEnv(path.join(__dirname, ".env"));
const API_KEY = env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

async function main() {
  if (!API_KEY) {
    console.error(
      "Missing VITE_GEMINI_API_KEY in frontend/.env (or export it in the shell)."
    );
    process.exit(1);
  }

  console.log("📤 Uploading PDFs to Gemini File API…\n");
  const uris = [];
  for (const entry of PDF_FILES) {
    const uri = await uploadFile(entry);
    if (uri) uris.push(uri);
  }

  console.log("\n✅ Done! Paste these URIs into AdvokateChat.jsx if needed:");
  console.log(JSON.stringify(uris, null, 2));
}

main();
