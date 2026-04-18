const fs = require('fs/promises');
const path = require('path');
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

const getPenalCodes = async (req, res) => {
  try {
    const { q = '', limit = '100' } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

    let query = {};
    if (q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query = {
        $or: [
          { section: regex },
          { title: regex },
          { content: regex },
          { chapter: regex },
          { chapterTitle: regex },
        ],
      };
    }

    const codes = await PenalCode.find(query)
      .sort({ section: 1 })
      .limit(parsedLimit);

    return res.status(200).json({
      count: codes.length,
      data: codes,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const importPenalCodes = async (req, res) => {
  try {
    const sourceFileName = req.query.file || process.env.PENAL_CODES_FILE || 'cleanPPC.json';
    const filePath = path.resolve(__dirname, `../../../frontend/src/data/${sourceFileName}`);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const records = normalizePenalCodeRecords(parsed);
    const dedupedRecords = dedupeBySection(records);

    if (!dedupedRecords.length) {
      return res.status(400).json({
        message:
          'No penal code records found to import. Expected sections/offenses with section numbers.',
      });
    }

    await PenalCode.deleteMany({});
    await PenalCode.insertMany(dedupedRecords, { ordered: false });

    return res.status(200).json({
      message: 'Penal codes replaced successfully',
      sourceFileName,
      replacedAllRecords: true,
      insertedCount: dedupedRecords.length,
      totalProcessed: records.length,
      duplicatesRemoved: records.length - dedupedRecords.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPenalCodes,
  importPenalCodes,
};
