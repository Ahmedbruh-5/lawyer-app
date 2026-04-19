const path = require('path');

const slugify = (raw) =>
  String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160);

/**
 * Flat array rows: { chapter, chapterTitle, section, title, content }
 * (e.g. backend/src/data/pakistan_penal_code.json)
 */
const looksLikeFlatPpc = (parsed) => {
  if (!Array.isArray(parsed) || !parsed.length) return false;
  const row = parsed[0];
  if (!row || typeof row !== 'object') return false;
  if (Array.isArray(row.sections) || Array.isArray(row.offenses)) return false;
  return (
    row.section != null &&
    (typeof row.content === 'string' ||
      typeof row.title === 'string' ||
      row.description != null)
  );
};

const normalizeFlatPpcRecords = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && r.section != null && String(r.section).trim() !== '')
    .map((r) => ({
      chapter: String(r.chapter ?? '').trim() || 'Unknown Chapter',
      chapterTitle: String(r.chapterTitle ?? '').trim(),
      section: String(r.section).trim(),
      title: String(r.title ?? '').trim(),
      content: String(r.content ?? r.description ?? '').trim(),
    }));
};

const normalizePenalCodeRecords = (parsed) => {
  const chapters = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.chapters)
      ? parsed.chapters
      : [];

  return chapters.flatMap((chapterItem) => {
    const chapter = chapterItem.chapter || 'Unknown Chapter';
    const chapterTitle = chapterItem.title || '';
    const sections = Array.isArray(chapterItem.sections)
      ? chapterItem.sections
      : Array.isArray(chapterItem.offenses)
        ? chapterItem.offenses
        : [];

    return sections
      .filter((sectionItem) => sectionItem.section)
      .map((sectionItem) => ({
        chapter,
        chapterTitle,
        section: String(sectionItem.section).trim(),
        title: sectionItem.title || '',
        content: sectionItem.content || sectionItem.description || '',
      }));
  });
};

const isActsCorpusRow = (row) =>
  row &&
  typeof row === 'object' &&
  typeof row.text === 'string' &&
  (row.act_title != null || row.doc_id != null);

const normalizeActsRecords = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((r, index) => {
    const title = String(r.act_title || r.title || 'Untitled').trim();
    let section = String(r.doc_id || '').trim();
    if (!section) {
      section = slugify(`${title}-${r.year ?? 'na'}-${index}`) || `act-${index}`;
    }

    const yearPart = r.year != null && r.year !== '' ? `Year ${r.year}` : '';
    const statusPart = r.status ? String(r.status).replace(/_/g, ' ') : '';
    const updatedPart = r.updated_till ? `Updated till ${r.updated_till}` : '';
    const chapterTitle = [yearPart, statusPart, updatedPart].filter(Boolean).join(' · ');

    const chapter =
      (r.category && String(r.category).trim()) ||
      (r.type && String(r.type).trim()) ||
      'Statute';

    return {
      chapter,
      chapterTitle,
      section,
      title,
      content: String(r.text || ''),
    };
  });
};

const looksLikeActsCorpus = (parsed) =>
  Array.isArray(parsed) &&
  parsed.length > 0 &&
  isActsCorpusRow(parsed[0]);

const normalizeFromParsed = (parsed) => {
  if (looksLikeActsCorpus(parsed)) return normalizeActsRecords(parsed);
  if (looksLikeFlatPpc(parsed)) return normalizeFlatPpcRecords(parsed);
  return normalizePenalCodeRecords(parsed);
};

const dedupeBySection = (records) => {
  const uniqueBySection = new Map();
  records.forEach((record) => {
    if (!record.section) return;
    uniqueBySection.set(record.section, record);
  });
  return Array.from(uniqueBySection.values());
};

/**
 * Default JSON path for Pakistan PPC import (PenalCode search).
 */
const defaultPenalImportPath = () =>
  path.resolve(__dirname, '../data/pakistan_penal_code.json');

/**
 * Legacy PPC chapter/sections JSON (e.g. cleanPPC.json) under frontend/src/data.
 */
const legacyFrontendDataPath = (fileName) =>
  path.resolve(__dirname, `../../../frontend/src/data/${fileName}`);

module.exports = {
  normalizePenalCodeRecords,
  normalizeFlatPpcRecords,
  normalizeActsRecords,
  normalizeFromParsed,
  dedupeBySection,
  defaultPenalImportPath,
  legacyFrontendDataPath,
};
