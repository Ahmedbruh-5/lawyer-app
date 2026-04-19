const fs = require('fs/promises');
const path = require('path');
const PenalCode = require('../models/PenalCode');
const {
  normalizeFromParsed,
  dedupeBySection,
  defaultPenalImportPath,
  legacyFrontendDataPath,
} = require('../utils/penalCodeNormalizer');

const BATCH_SIZE = 80;

const resolveImportFilePath = (req) => {
  const queryFile = req.query.file && String(req.query.file).trim();
  const queryPath = req.query.path && String(req.query.path).trim();

  if (queryPath) {
    return path.isAbsolute(queryPath) ? queryPath : path.resolve(process.cwd(), queryPath);
  }

  const envPath = process.env.PENAL_CODES_IMPORT_PATH;
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  }

  if (queryFile || process.env.PENAL_CODES_FILE) {
    const name = queryFile || process.env.PENAL_CODES_FILE;
    return legacyFrontendDataPath(name);
  }

  return defaultPenalImportPath();
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

    const codes = await PenalCode.find(query).sort({ title: 1 }).limit(parsedLimit);

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
    const filePath = resolveImportFilePath(req);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const records = normalizeFromParsed(parsed);
    const dedupedRecords = dedupeBySection(records);

    if (!dedupedRecords.length) {
      return res.status(400).json({
        message:
          'No penal code records found to import. Expected acts corpus (act_title + text/doc_id) or chapters with sections.',
      });
    }

    await PenalCode.deleteMany({});

    for (let i = 0; i < dedupedRecords.length; i += BATCH_SIZE) {
      const batch = dedupedRecords.slice(i, i + BATCH_SIZE);
      await PenalCode.insertMany(batch, { ordered: false });
    }

    return res.status(200).json({
      message: 'Penal codes replaced successfully',
      filePath,
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
