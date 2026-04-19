const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
const connectDB = require('../config/db');
const PenalCode = require('../models/PenalCode');
const {
  normalizeFromParsed,
  dedupeBySection,
  defaultPenalImportPath,
  legacyFrontendDataPath,
} = require('../utils/penalCodeNormalizer');

const BATCH_SIZE = 80;

const importPenalCodes = async () => {
  try {
    await connectDB();

    const envPath = process.env.PENAL_CODES_IMPORT_PATH;
    const envLegacy = process.env.PENAL_CODES_FILE;

    let filePath;
    if (envPath) {
      filePath = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    } else if (envLegacy) {
      filePath = legacyFrontendDataPath(envLegacy);
    } else {
      filePath = defaultPenalImportPath();
    }

    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const records = normalizeFromParsed(parsed);
    const dedupedRecords = dedupeBySection(records);

    if (!dedupedRecords.length) {
      throw new Error(
        `No penal code records found in ${filePath}. Expected acts corpus (act_title + text) or chapters with sections.`
      );
    }

    await PenalCode.deleteMany({});

    for (let i = 0; i < dedupedRecords.length; i += BATCH_SIZE) {
      const batch = dedupedRecords.slice(i, i + BATCH_SIZE);
      await PenalCode.insertMany(batch, { ordered: false });
    }

    console.log('Penal code replace import complete');
    console.log({
      filePath,
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
