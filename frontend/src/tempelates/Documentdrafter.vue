<template>
  <div class="drafter">
    <!-- Step 1: Template Picker -->
    <transition name="slide-fade" mode="out-in">
      <div v-if="step === 'pick'" key="pick" class="step-pick">
        <div class="step-header">
          <p class="step-label">Document Drafting</p>
          <h1 class="step-title">What do you need to draft?</h1>
        </div>
        <div class="doc-grid">
          <button
            v-for="doc in docTypes"
            :key="doc.id"
            class="doc-card"
            :class="{ selected: selected === doc.id }"
            @click="selected = doc.id"
          >
            <span class="doc-icon">{{ doc.icon }}</span>
            <span class="doc-name">{{ doc.name }}</span>
            <span class="doc-desc">{{ doc.desc }}</span>
          </button>
        </div>
        <button class="btn-primary" :disabled="!selected" @click="goToForm">
          Continue <span class="arrow">→</span>
        </button>
      </div>

      <!-- Step 2: Fill Fields -->
      <div v-else-if="step === 'form'" key="form" class="step-form">
        <button class="btn-back" @click="step = 'pick'">← Back</button>
        <div class="step-header">
          <p class="step-label">{{ currentDoc.icon }} {{ currentDoc.name }}</p>
          <h1 class="step-title">Fill in the details</h1>
        </div>
        <div class="fields">
          <div v-for="field in currentDoc.fields" :key="field.key" class="field-group">
            <label>{{ field.label }}</label>
            <textarea
              v-if="field.type === 'textarea'"
              v-model="formData[field.key]"
              :placeholder="field.placeholder"
              rows="3"
            />
            <input
              v-else
              v-model="formData[field.key]"
              :type="field.type || 'text'"
              :placeholder="field.placeholder"
            />
          </div>
        </div>
        <button class="btn-primary" :disabled="!canGenerate" @click="generate">
          <span v-if="!loading">Generate Document ✦</span>
          <span v-else class="loading-text">
            <span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span> Drafting
          </span>
        </button>
      </div>

      <!-- Step 3: Result -->
      <div v-else-if="step === 'result'" key="result" class="step-result">
        <button class="btn-back" @click="step = 'form'">← Edit details</button>
        <div class="step-header">
          <p class="step-label">{{ currentDoc.icon }} {{ currentDoc.name }} — Ready</p>
          <h1 class="step-title">Your document is ready</h1>
        </div>
        <div class="disclaimer">
          ⚠️ This is an AI-generated draft for reference only. Have it reviewed by a qualified Pakistani advocate before signing or submitting to any court or authority.
        </div>
        <div class="doc-preview">
          <pre>{{ generatedText }}</pre>
        </div>
        <div class="download-row">
          <button class="btn-download pdf" @click="downloadPdf">
            ⬇ Download PDF
          </button>
          <button class="btn-download docx" @click="downloadDocx">
            ⬇ Download Word (.docx)
          </button>
          <button class="btn-secondary" @click="reset">Draft another</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ── jsPDF (UMD via CDN — loaded in index.html or dynamically below) ──────────
// We load jsPDF + docx dynamically so this component is self-contained.

const step = ref('pick')
const selected = ref(null)
const formData = ref({})
const generatedText = ref('')
const loading = ref(false)

// ── Document types + their fields ────────────────────────────────────────────
const docTypes = [
  {
    id: 'affidavit',
    icon: '📜',
    name: 'Affidavit',
    desc: 'Sworn written statement of facts',
    fields: [
      { key: 'deponentName',  label: 'Deponent full name',     placeholder: 'e.g. Muhammad Ali Khan' },
      { key: 'deponentCnic',  label: 'CNIC / ID number',       placeholder: 'e.g. 35202-1234567-1' },
      { key: 'address',       label: 'Residential address',    placeholder: 'Full address' },
      { key: 'facts',         label: 'Facts to be affirmed',   placeholder: 'Describe the facts in your own words…', type: 'textarea' },
      { key: 'purpose',       label: 'Purpose of affidavit',   placeholder: 'e.g. For submission to NADRA' },
    ],
  },
  {
    id: 'legal_notice',
    icon: '⚖️',
    name: 'Legal Notice',
    desc: 'Formal notice to another party',
    fields: [
      { key: 'senderName',    label: 'Sender name',            placeholder: 'Your name or client name' },
      { key: 'recipientName', label: 'Recipient name',         placeholder: 'Other party name' },
      { key: 'subject',       label: 'Subject matter',         placeholder: 'e.g. Non-payment of rent' },
      { key: 'grievance',     label: 'Grievance / details',    placeholder: 'Explain the issue…', type: 'textarea' },
      { key: 'demand',        label: 'Demand / relief sought', placeholder: 'e.g. Pay PKR 200,000 within 15 days' },
      { key: 'deadline',      label: 'Compliance deadline',    placeholder: 'e.g. 15 days from receipt' },
    ],
  },
  {
    id: 'poa',
    icon: '🖊️',
    name: 'Power of Attorney',
    desc: 'Authorise someone to act for you',
    fields: [
      { key: 'principalName', label: 'Principal (grantor) name',  placeholder: 'Your full name' },
      { key: 'principalCnic', label: 'Principal CNIC',             placeholder: '35202-xxxxxxx-x' },
      { key: 'attorneyName',  label: 'Attorney (agent) name',     placeholder: 'Name of person you are authorising' },
      { key: 'attorneyCnic',  label: 'Attorney CNIC',              placeholder: '35202-xxxxxxx-x' },
      { key: 'powers',        label: 'Powers being granted',      placeholder: 'e.g. Manage property, sign contracts…', type: 'textarea' },
      { key: 'scope',         label: 'Scope / limitations',       placeholder: 'e.g. Limited to property at XYZ address' },
    ],
  },
  {
    id: 'undertaking',
    icon: '✍️',
    name: 'Undertaking',
    desc: 'Written promise or commitment',
    fields: [
      { key: 'partyName',     label: 'Undertaking party name',   placeholder: 'Full name of person giving undertaking' },
      { key: 'recipientOrg',  label: 'Recipient / authority',    placeholder: 'e.g. University of Punjab' },
      { key: 'commitment',    label: 'Commitment / promise',     placeholder: 'Describe what is being promised…', type: 'textarea' },
      { key: 'consequences',  label: 'Consequences if breached', placeholder: 'Optional' },
    ],
  },
  {
    id: 'mou',
    icon: '🤝',
    name: 'MoU',
    desc: 'Memorandum of Understanding',
    fields: [
      { key: 'party1',        label: 'Party 1 name',             placeholder: 'First party full name / organisation' },
      { key: 'party2',        label: 'Party 2 name',             placeholder: 'Second party full name / organisation' },
      { key: 'purpose',       label: 'Purpose of MoU',           placeholder: 'What is this agreement about?' },
      { key: 'obligations1',  label: 'Party 1 obligations',      placeholder: 'What Party 1 agrees to do…', type: 'textarea' },
      { key: 'obligations2',  label: 'Party 2 obligations',      placeholder: 'What Party 2 agrees to do…', type: 'textarea' },
      { key: 'duration',      label: 'Duration / validity',      placeholder: 'e.g. 1 year from signing' },
    ],
  },
  {
    id: 'vakalatnama',
    icon: '👨‍⚖️',
    name: 'Vakalatnama',
    desc: 'Authorise a lawyer to represent you',
    fields: [
      { key: 'clientName',    label: 'Client full name',         placeholder: 'e.g. Ayesha Siddiqui' },
      { key: 'clientCnic',    label: 'Client CNIC',              placeholder: '35202-xxxxxxx-x' },
      { key: 'lawyerName',    label: 'Advocate name',            placeholder: 'e.g. Barrister Usman Ghani' },
      { key: 'court',         label: 'Court / tribunal',         placeholder: 'e.g. Lahore High Court' },
      { key: 'caseDetails',   label: 'Case / matter description',placeholder: 'Brief description of the matter', type: 'textarea' },
    ],
  },
]

const currentDoc = computed(() => docTypes.find(d => d.id === selected.value))

const canGenerate = computed(() => {
  if (!currentDoc.value) return false
  return currentDoc.value.fields
    .filter(f => !f.optional)
    .every(f => formData.value[f.key]?.trim())
})

function goToForm () {
  formData.value = {}
  step.value = 'form'
}

function reset () {
  selected.value = null
  formData.value = {}
  generatedText.value = ''
  step.value = 'pick'
}

// ── AI generation via Anthropic API ──────────────────────────────────────────
async function generate () {
  loading.value = true
  try {
    const doc  = currentDoc.value
    const data = formData.value

    // Build a structured prompt from form fields
    const fieldsSummary = doc.fields
      .map(f => `${f.label}: ${data[f.key] || '(not provided)'}`)
      .join('\n')

    const systemPrompt = `You are a senior Pakistani legal document drafter with expertise in Pakistani law. You draft documents that comply with the following laws and rules:

- Affidavits: Qanun-e-Shahadat Order 1984 (oath/affirmation), Oaths Act 1873, Civil Procedure Code 1908 (Order XIX)
- Power of Attorney: Powers of Attorney Act 1882, Contract Act 1872
- Legal Notices: Civil Procedure Code 1908, Limitation Act 1908 (mention relevant limitation period where applicable)
- Undertakings: Contract Act 1872 (valid consideration, free consent)
- MoU: Contract Act 1872, governed by Pakistani law, jurisdiction of relevant High Court
- Vakalatnama: Legal Practitioners and Bar Councils Act 1973, CPC Order III

Formatting rules you MUST follow:
1. Start every document with "IN THE NAME OF ALLAH, THE MOST GRACIOUS, THE MOST MERCIFUL" on its own line (except Legal Notice).
2. Use the correct document title in bold caps (e.g. AFFIDAVIT, SPECIAL POWER OF ATTORNEY).
3. Include witness/attestation block at the end: two witnesses with name, CNIC, address lines.
4. For Affidavits: include the standard jurat — "Sworn/affirmed before me on this ___ day of _________ 20__, at _________, Pakistan. Oath Commissioner / Notary Public."
5. For Vakalatnama: include the standard bar council format with stamp duty note.
6. Currency must be in Pakistani Rupees (PKR). Dates use DD/MM/YYYY. Courts use Pakistani court names.
7. Output ONLY the document — no explanations, no preamble, no markdown. Plain text only, ready to print and sign.`

    const userPrompt = `Draft a complete, court-ready ${doc.name} under Pakistani law using these details:

${fieldsSummary}

Output the full document now.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const result = await response.json()
    generatedText.value = result.content?.[0]?.text?.trim() || 'Error: no content returned.'
    step.value = 'result'
  } catch (err) {
    alert('Generation failed: ' + err.message)
  } finally {
    loading.value = false
  }
}

// ── PDF download via jsPDF ────────────────────────────────────────────────────
async function downloadPdf () {
  // Dynamically load jsPDF if not already loaded
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  }
  const { jsPDF } = window.jspdf
  const pdf  = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 20
  const maxWidth = 170
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  const lines = pdf.splitTextToSize(generatedText.value, maxWidth)
  let y = margin
  lines.forEach(line => {
    if (y > 270) { pdf.addPage(); y = margin }
    pdf.text(line, margin, y)
    y += 6
  })
  pdf.save(`${currentDoc.value.id}_draft.pdf`)
}

// ── DOCX download via docx.js ─────────────────────────────────────────────────
async function downloadDocx () {
  if (!window.docx) {
    await loadScript('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js')
  }
  const { Document, Packer, Paragraph, TextRun } = window.docx
  const paragraphs = generatedText.value.split('\n').map(line =>
    new Paragraph({ children: [new TextRun({ text: line, size: 24, font: 'Times New Roman' })] })
  )
  const doc  = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${currentDoc.value.id}_draft.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function loadScript (src) {
  return new Promise((resolve, reject) => {
    const s  = document.createElement('script')
    s.src    = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

.drafter {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #f7f5f0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  color: #1a1714;
}

/* ── Step shared ── */
.step-pick, .step-form, .step-result {
  width: 100%;
  max-width: 680px;
}

.step-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #8a7f72;
  margin: 0 0 8px;
}

.step-title {
  font-family: 'Lora', serif;
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 32px;
  line-height: 1.2;
  color: #1a1714;
}

/* ── Doc grid ── */
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.doc-card {
  background: #fff;
  border: 1.5px solid #e5e0d8;
  border-radius: 12px;
  padding: 18px 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color .15s, box-shadow .15s, transform .1s;
}
.doc-card:hover {
  border-color: #c9a96e;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  transform: translateY(-1px);
}
.doc-card.selected {
  border-color: #b8870a;
  background: #fffbf2;
  box-shadow: 0 0 0 3px rgba(184,135,10,.12);
}
.doc-icon  { font-size: 22px; }
.doc-name  { font-size: 14px; font-weight: 500; margin-top: 4px; }
.doc-desc  { font-size: 12px; color: #8a7f72; line-height: 1.4; }

/* ── Form fields ── */
.fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 28px; }

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 13px; font-weight: 500; color: #4a4238; }

.field-group input,
.field-group textarea {
  background: #fff;
  border: 1.5px solid #e5e0d8;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #1a1714;
  resize: vertical;
  transition: border-color .15s;
  outline: none;
}
.field-group input:focus,
.field-group textarea:focus { border-color: #b8870a; }

/* ── Buttons ── */
.btn-primary {
  background: #1a1714;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 13px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background .15s, transform .1s;
}
.btn-primary:hover:not(:disabled) { background: #b8870a; }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.btn-primary .arrow { transition: transform .15s; }
.btn-primary:hover .arrow { transform: translateX(4px); }

.btn-back {
  background: none;
  border: none;
  color: #8a7f72;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  display: block;
}
.btn-back:hover { color: #1a1714; }

.btn-secondary {
  background: transparent;
  border: 1.5px solid #e5e0d8;
  border-radius: 8px;
  padding: 11px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
  color: #4a4238;
  transition: border-color .15s;
}
.btn-secondary:hover { border-color: #b8870a; color: #b8870a; }

/* ── Disclaimer ── */
.disclaimer {
  background: #fff8e1;
  border: 1.5px solid #f0c040;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 12.5px;
  color: #7a5c00;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* ── Result ── */
.doc-preview {
  background: #fff;
  border: 1.5px solid #e5e0d8;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 24px;
  max-height: 420px;
  overflow-y: auto;
}
.doc-preview pre {
  font-family: 'Lora', serif;
  font-size: 13.5px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: #1a1714;
}

.download-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.btn-download {
  border: none;
  border-radius: 8px;
  padding: 12px 22px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.btn-download:hover { opacity: .85; transform: translateY(-1px); }
.btn-download.pdf  { background: #c0392b; color: #fff; }
.btn-download.docx { background: #1a5276; color: #fff; }

/* ── Loading dots ── */
@keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
.dot-1 { animation: blink 1.2s infinite .0s }
.dot-2 { animation: blink 1.2s infinite .2s }
.dot-3 { animation: blink 1.2s infinite .4s }

/* ── Transitions ── */
.slide-fade-enter-active { transition: all .25s ease; }
.slide-fade-leave-active { transition: all .2s ease; }
.slide-fade-enter-from   { opacity: 0; transform: translateY(14px); }
.slide-fade-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>