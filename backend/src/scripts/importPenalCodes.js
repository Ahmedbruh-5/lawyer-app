const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
const connectDB = require('../config/db');
const PenalCode = require('../models/PenalCode');

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

const dedupeBySection = (records) => {
  const uniqueBySection = new Map();

  records.forEach((record) => {
    if (!record.section) return;
    // Keep the last occurrence for each section key.
    uniqueBySection.set(record.section, record);
  });

  return Array.from(uniqueBySection.values());
};

const importPenalCodes = async () => {
  try {
    await connectDB();

    const sourceFileName = process.env.PENAL_CODES_FILE || 'cleanPPC.json';
    const filePath = path.resolve(__dirname, `../../../frontend/src/data/${sourceFileName}`);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const records = normalizePenalCodeRecords(parsed);
    const dedupedRecords = dedupeBySection(records);

    if (!dedupedRecords.length) {
      throw new Error(
        `No penal code records found in ${sourceFileName}. Expected sections/offenses with section numbers.`
      );
    }

    await PenalCode.deleteMany({});
    await PenalCode.insertMany(dedupedRecords, { ordered: false });

    console.log('Penal code replace import complete');
    console.log({
      sourceFileName,
      replacedAllRecords: true,
      insertedCount: dedupedRecords.length,
      totalProcessed: records.length,
      duplicatesRemoved: records.length - dedupedRecords.length,
    });
    process.exit(0);
  } catch (error) {
    console.error(`Penal code import failed: ${error.message}`);
    process.exit(1);
  }
};

importPenalCodes();
