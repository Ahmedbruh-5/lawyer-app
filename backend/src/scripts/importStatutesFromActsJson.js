/**
 * Import replace for the Statutes collection from a JSON array of acts.
 *
 * Expected shape (e.g. repo root `penalcodes.json`):
 *   [{ source_file, act_title, year, text, ... }, ...]
 *
 * This is NOT the same format as `frontend/src/data/cleanPPC.json` (chapters → sections).
 * For Pakistan Penal Code *sections* (Penal Code search page), use:
 *   npm run seed:penal-codes
 * with PENAL_CODES_FILE pointing at a PPC JSON file.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
const connectDB = require('../config/db');
const Statute = require('../models/Statute');

const repoRoot = path.resolve(__dirname, '../../..');

function inferType(title = '') {
  const t = String(title).toLowerCase();
  if (t.includes('ordinance')) return 'Ordinance';
  if (/\bact\b/.test(t)) return 'Act';
  if (t.includes('order') && !t.includes('ordinance')) return 'Order';
  if (t.includes('rules')) return 'Rules';
  return 'Other';
}

function normalizeYear(raw) {
  if (raw == null || raw === '') return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  await connectDB();

  const fileRef = process.env.STATUTES_JSON_FILE || 'penalcodes.json';
  const filePath = path.isAbsolute(fileRef) ? fileRef : path.join(repoRoot, fileRef);

  const raw = await fs.readFile(filePath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    throw new Error('Expected a JSON array of act documents');
  }

  const docs = rows.map((r) => ({
    fileName: String(r.source_file || r.file_name || '').trim(),
    title: String(r.act_title || r.title || 'Untitled').trim(),
    type: inferType(r.act_title || r.title),
    year: normalizeYear(r.year),
    text: String(r.text || ''),
  }));

  await Statute.deleteMany({});
  await Statute.insertMany(docs, { ordered: false });

  console.log('Statutes import complete (collection replaced)');
  console.log({
    filePath,
    insertedCount: docs.length,
  });
  process.exit(0);
}

main().catch((err) => {
  console.error('Statutes import failed:', err.message);
  process.exit(1);
});
