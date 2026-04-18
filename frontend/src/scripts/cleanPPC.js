import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rawData from '../data/rawPPC.json' with { type: 'json' }

const cleanText = (text = '') =>
  String(text)
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\d+\[[^\]]*]/g, '')
    .trim()

const stripFootnoteNoise = (text = '') =>
  cleanText(text)
    // Remove common editorial/legal-note tails.
    .replace(/\b(?:Subs?\.|Ins\.|Omitted by|Rep\. by|w\.e\.f\.)[^.]*\./gi, ' ')
    // Remove long note lines like "1The original section..."
    .replace(/\b\d+\s*(?:The|Clause|Illustration|Section)\b[^.]*\./gi, ' ')
    // Remove adaptation-order shorthand fragments (very common OCR noise).
    .replace(/\b[A-Z]\.\s*O\.,?\s*\d{4}[^.]*\./gi, ' ')
    .replace(/\bOrd\.\s*\d+[^.]*\./gi, ' ')
    // Remove dense star blocks.
    .replace(/\[\s*\*\s*(?:\*\s*){2,}\]/g, ' ')
    // Collapse again after removals.
    .replace(/\s+/g, ' ')
    .trim()

const cleanTitle = (title = '') =>
  cleanText(title)
    .replace(/^\d+\.\s*/, '')
    .replace(/^\[+|\]+$/g, '')
    .replace(/^"+|"+$/g, '')
    .trim()

const BROKEN_TITLE_ENDINGS = /\b(in|of|with|and|or|to|for|by|within|under|from|the|any|a|an)$/i

const extractFirstSentence = (text = '') => {
  const match = cleanText(text).match(/^[^.?!]+[.?!]?/)
  return match ? match[0].trim() : ''
}

const looksLikeWeakTitle = (title = '') =>
  !title ||
  title === '""' ||
  title === '[Repealed]' ||
  title === 'Repealed' ||
  title.length < 4 ||
  /^["“”]+[^"“”]*["“”]+$/.test(title)

const removeLeadingSectionNumber = (text = '', currentSection = '') => {
  const escaped = String(currentSection).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return text
  return text.replace(new RegExp(`^${escaped}\\.?\\s*`, 'i'), '').trim()
}

const trimAtNextSectionMarker = (text = '', currentSection = '') => {
  const current = Number.parseInt(currentSection, 10)
  if (!Number.isFinite(current)) return text

  const nextSection = current + 1
  // If the text accidentally includes the next section heading, cut before it.
  const markerRegex = new RegExp(`\\b${nextSection}\\.?\\s*(?:["“\\[]|[A-Z])`)
  const markerIndex = text.search(markerRegex)
  if (markerIndex <= 0) return text
  return text.slice(0, markerIndex).trim()
}

const finalizeTitle = (title = '') =>
  cleanTitle(title)
    .replace(/\s+/g, ' ')
    .replace(/\s*[,:;]+$/, '')
    .trim()

const splitTitleAndOverflow = (title = '') => {
  const normalized = cleanTitle(title)
  const periodIndex = normalized.indexOf('.')
  if (periodIndex <= 0) return { shortTitle: normalized, overflow: '' }

  const firstPart = normalized.slice(0, periodIndex + 1).trim()
  const rest = normalized.slice(periodIndex + 1).trim()

  // Keep short legal headings as title, move definitional prose to content.
  if (firstPart.length <= 120) {
    return { shortTitle: firstPart, overflow: rest }
  }

  return { shortTitle: normalized, overflow: '' }
}

const fixOffense = (offense) => {
  let title = cleanTitle(offense.title)
  let content = stripFootnoteNoise(offense.text)
  content = removeLeadingSectionNumber(content, offense.section)
  content = trimAtNextSectionMarker(content, offense.section)

  const titleIsEmpty = looksLikeWeakTitle(title)
  const titleLooksBroken = BROKEN_TITLE_ENDINGS.test(title)

  if ((titleIsEmpty || titleLooksBroken) && content) {
    const firstSentence = extractFirstSentence(content)
    if (firstSentence) {
      title = titleIsEmpty ? firstSentence : `${title} ${firstSentence}`.trim()
      content = content.slice(firstSentence.length).trim()
    }
  }

  const { shortTitle, overflow } = splitTitleAndOverflow(title)
  title = shortTitle
  if (overflow) {
    content = `${overflow} ${content}`.trim()
  }

  title = finalizeTitle(title)
  content = cleanText(content)

  return {
    section: String(offense.section || '').trim(),
    title,
    content,
  }
}

const chapters = Array.isArray(rawData.chapters) ? rawData.chapters : []

const cleanedData = chapters.map((chapter) => ({
  chapter: chapter.chapter,
  title: cleanText(chapter.title),
  offenses: Array.isArray(chapter.offenses) ? chapter.offenses.map(fixOffense) : [],
}))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputPath = path.join(__dirname, '../data/cleanPPC.json')
fs.writeFileSync(outputPath, JSON.stringify({ chapters: cleanedData }, null, 2), 'utf8')

console.log(`✅ Cleaned data saved at ${outputPath}`)