import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FeaturePageLayout from './FeaturePageLayout'
import { useSiteTheme } from '../../hooks/useSiteTheme'
import { notifyError } from '../../utils/swal'

const docTypes = {
  en: [
    {
      id: 'affidavit',
      icon: '📜',
      name: 'Affidavit',
      desc: 'Sworn written statement of facts',
      fields: [
        { key: 'deponentName', label: 'Deponent full name', placeholder: 'e.g. Muhammad Ali Khan' },
        { key: 'deponentCnic', label: 'CNIC / ID number', placeholder: 'e.g. 35202-1234567-1' },
        { key: 'address', label: 'Residential address', placeholder: 'Full address' },
        { key: 'facts', label: 'Facts to be affirmed', placeholder: 'Describe the facts...', type: 'textarea' },
        { key: 'purpose', label: 'Purpose of affidavit', placeholder: 'e.g. For submission to NADRA' },
      ],
    },
    {
      id: 'legal_notice',
      icon: '⚖️',
      name: 'Legal Notice',
      desc: 'Formal notice to another party',
      fields: [
        { key: 'senderName', label: 'Sender name', placeholder: 'Your name or client name' },
        { key: 'recipientName', label: 'Recipient name', placeholder: 'Other party name' },
        { key: 'subject', label: 'Subject matter', placeholder: 'e.g. Non-payment of rent' },
        { key: 'grievance', label: 'Grievance / details', placeholder: 'Explain the issue...', type: 'textarea' },
        { key: 'demand', label: 'Demand / relief sought', placeholder: 'e.g. Pay PKR 200,000 within 15 days' },
        { key: 'deadline', label: 'Compliance deadline', placeholder: 'e.g. 15 days from receipt' },
      ],
    },
    {
      id: 'poa',
      icon: '🖊️',
      name: 'Power of Attorney',
      desc: 'Authorise someone to act for you',
      fields: [
        { key: 'principalName', label: 'Principal name', placeholder: 'Your full name' },
        { key: 'principalCnic', label: 'Principal CNIC', placeholder: '35202-xxxxxxx-x' },
        { key: 'attorneyName', label: 'Attorney (agent) name', placeholder: 'Name of person you authorise' },
        { key: 'attorneyCnic', label: 'Attorney CNIC', placeholder: '35202-xxxxxxx-x' },
        { key: 'powers', label: 'Powers being granted', placeholder: 'e.g. Manage property...', type: 'textarea' },
        { key: 'scope', label: 'Scope / limitations', placeholder: 'e.g. Limited to property at XYZ address' },
      ],
    },
  ],
  ur: [
    {
      id: 'affidavit',
      icon: '📜',
      name: 'حلف نامہ',
      desc: 'حقائق پر مبنی حلفیہ بیان',
      fields: [
        { key: 'deponentName', label: 'حلف دینے والے کا مکمل نام', placeholder: 'مثلاً محمد علی خان' },
        { key: 'deponentCnic', label: 'شناختی کارڈ نمبر', placeholder: 'مثلاً 35202-1234567-1' },
        { key: 'address', label: 'رہائشی پتہ', placeholder: 'مکمل پتہ' },
        { key: 'facts', label: 'تصدیق شدہ حقائق', placeholder: 'حقائق لکھیں...', type: 'textarea' },
        { key: 'purpose', label: 'حلف نامہ کا مقصد', placeholder: 'مثلاً نادرا میں جمع کروانے کے لیے' },
      ],
    },
    {
      id: 'legal_notice',
      icon: '⚖️',
      name: 'لیگل نوٹس',
      desc: 'دوسری پارٹی کو باضابطہ نوٹس',
      fields: [
        { key: 'senderName', label: 'بھیجنے والے کا نام', placeholder: 'آپ یا موکل کا نام' },
        { key: 'recipientName', label: 'وصول کنندہ کا نام', placeholder: 'دوسری پارٹی کا نام' },
        { key: 'subject', label: 'موضوع', placeholder: 'مثلاً کرایہ کی عدم ادائیگی' },
        { key: 'grievance', label: 'شکایت / تفصیل', placeholder: 'مسئلہ تفصیل سے لکھیں...', type: 'textarea' },
        { key: 'demand', label: 'مطالبہ / مطلوبہ ریلیف', placeholder: 'مثلاً 15 دن میں 200,000 روپے ادا کریں' },
        { key: 'deadline', label: 'تعمیل کی آخری تاریخ', placeholder: 'مثلاً وصولی کے 15 دن کے اندر' },
      ],
    },
    {
      id: 'poa',
      icon: '🖊️',
      name: 'پاور آف اٹارنی',
      desc: 'کسی کو اپنے behalf پر اختیار دیں',
      fields: [
        { key: 'principalName', label: 'پرنسپل (اختیار دینے والا) کا نام', placeholder: 'آپ کا مکمل نام' },
        { key: 'principalCnic', label: 'پرنسپل کا شناختی کارڈ نمبر', placeholder: '35202-xxxxxxx-x' },
        { key: 'attorneyName', label: 'اٹارنی (نمائندہ) کا نام', placeholder: 'جسے اختیار دے رہے ہیں' },
        { key: 'attorneyCnic', label: 'اٹارنی کا شناختی کارڈ نمبر', placeholder: '35202-xxxxxxx-x' },
        { key: 'powers', label: 'دیے جانے والے اختیارات', placeholder: 'مثلاً جائیداد کا انتظام...', type: 'textarea' },
        { key: 'scope', label: 'حدود / پابندیاں', placeholder: 'مثلاً صرف XYZ جائیداد تک محدود' },
      ],
    },
  ],
}

function buildDraft(doc, data, language) {
  const today = new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB')

  if (doc.id === 'affidavit' && language === 'ur') {
    return `بسم اللہ الرحمٰن الرحیم

حلف نامہ

میں، ${data.deponentName || '____________________'}، شناختی کارڈ نمبر ${data.deponentCnic || '____________________'}، رہائشی ${data.address || '____________________'}، حلفاً اقرار کرتا/کرتی ہوں کہ:

1. اس حلف نامہ میں درج تمام بیانات میرے علم اور یقین کے مطابق درست ہیں۔
2. بیان کردہ حقائق: ${data.facts || '____________________'}۔
3. یہ حلف نامہ ${data.purpose || '____________________'} کے مقصد کے لیے مرتب کیا گیا ہے۔

آج بتاریخ ${today} پاکستان میں میرے سامنے حلف لیا گیا/تصدیق کی گئی۔

____________________
حلف دینے والا/والی

____________________
اوتھ کمشنر / نوٹری پبلک
`
  }

  if (doc.id === 'affidavit') {
    return `IN THE NAME OF ALLAH, THE MOST GRACIOUS, THE MOST MERCIFUL

AFFIDAVIT

I, ${data.deponentName || '____________________'}, CNIC ${data.deponentCnic || '____________________'}, resident of ${data.address || '____________________'}, do hereby solemnly affirm and declare:

1. That the contents stated herein are true to the best of my knowledge and belief.
2. Facts affirmed: ${data.facts || '____________________'}.
3. This affidavit is made for the purpose of ${data.purpose || '____________________'}.

Sworn/affirmed before me on this ${today} at ___________________, Pakistan.

____________________
DEPONENT

____________________
Oath Commissioner / Notary Public
`
  }

  if (doc.id === 'legal_notice' && language === 'ur') {
    return `لیگل نوٹس

تاریخ: ${today}
بنام: ${data.recipientName || '____________________'}
جانب: ${data.senderName || '____________________'}
موضوع: ${data.subject || '____________________'}

موکل کی ہدایات کے مطابق یہ قانونی نوٹس ارسال کیا جا رہا ہے:

تفصیلِ شکایت:
${data.grievance || '____________________'}

مطالبہ:
${data.demand || '____________________'}

آپ کو ہدایت کی جاتی ہے کہ ${data.deadline || '____________________'} کے اندر تعمیل کریں، بصورت دیگر قانونی کارروائی آپ کے خرچ اور ذمہ داری پر کی جائے گی۔

____________________
ایڈووکیٹ / مجاز نمائندہ
`
  }

  if (doc.id === 'legal_notice') {
    return `LEGAL NOTICE

Date: ${today}
From: ${data.senderName || '____________________'}
To: ${data.recipientName || '____________________'}
Subject: ${data.subject || '____________________'}

Under instructions from my client, this legal notice is hereby served:

Issue:
${data.grievance || '____________________'}

Demand:
${data.demand || '____________________'}

You are required to comply within ${data.deadline || '____________________'}, failing which legal proceedings shall be initiated at your risk, cost, and consequences.

____________________
Advocate / Authorized Sender
`
  }

  if (language === 'ur') {
    return `بسم اللہ الرحمٰن الرحیم

پاور آف اٹارنی

میں، ${data.principalName || '____________________'} (شناختی کارڈ نمبر: ${data.principalCnic || '____________________'})، اس کے ذریعے ${data.attorneyName || '____________________'} (شناختی کارڈ نمبر: ${data.attorneyCnic || '____________________'}) کو اپنا قانونی نمائندہ مقرر کرتا/کرتی ہوں۔

تفویض کردہ اختیارات:
${data.powers || '____________________'}

دائرہ کار / پابندیاں:
${data.scope || '____________________'}

یہ دستاویز ${today} کو مرتب کی گئی۔

____________________
پرنسپل

گواہ نمبر 1: ____________________
گواہ نمبر 2: ____________________
`
  }

  return `IN THE NAME OF ALLAH, THE MOST GRACIOUS, THE MOST MERCIFUL

POWER OF ATTORNEY

I, ${data.principalName || '____________________'} (CNIC: ${data.principalCnic || '____________________'}), hereby appoint ${data.attorneyName || '____________________'} (CNIC: ${data.attorneyCnic || '____________________'}) as my lawful attorney.

Granted powers:
${data.powers || '____________________'}

Scope / limitations:
${data.scope || '____________________'}

Executed on ${today}.

____________________
PRINCIPAL

Witness 1: ____________________
Witness 2: ____________________
`
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

function DocumentDrafterPage() {
  const { i18n } = useTranslation()
  const { isDark } = useSiteTheme()
  const initialLang = i18n.language === 'ur' ? 'ur' : 'en'
  const [docLanguage, setDocLanguage] = useState(initialLang)
  const [step, setStep] = useState('pick')
  const [selected, setSelected] = useState(null)
  const [formData, setFormData] = useState({})
  const [generatedText, setGeneratedText] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  const currentDocTypes = useMemo(() => docTypes[docLanguage], [docLanguage])
  const currentDoc = useMemo(() => currentDocTypes.find((d) => d.id === selected), [currentDocTypes, selected])

  const canGenerate = useMemo(() => {
    if (!currentDoc) return false
    return currentDoc.fields.every((f) => (formData[f.key] || '').trim())
  }, [currentDoc, formData])

  const reset = () => {
    setStep('pick')
    setSelected(null)
    setFormData({})
    setGeneratedText('')
  }

  const downloadPdf = async () => {
    if (!generatedText) return
    try {
      setIsDownloading(true)
      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      }
      const { jsPDF } = window.jspdf
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 15
      const maxWidth = 180
      const lines = pdf.splitTextToSize(generatedText, maxWidth)
      let y = margin
      lines.forEach((line) => {
        if (y > 280) {
          pdf.addPage()
          y = margin
        }
        pdf.text(line, margin, y)
        y += 6
      })
      const fileBase = currentDoc?.id || 'legal-draft'
      pdf.save(`${fileBase}.pdf`)
    } catch {
      notifyError(
        docLanguage === 'ur' ? 'پی ڈی ایف' : 'PDF download',
        docLanguage === 'ur' ? 'پی ڈی ایف ڈاؤن لوڈ میں مسئلہ پیش آیا۔' : 'Failed to download PDF.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadDocx = async () => {
    if (!generatedText) return
    try {
      setIsDownloading(true)
      if (!window.docx) {
        await loadScript('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js')
      }
      const { Document, Packer, Paragraph, TextRun } = window.docx
      const paragraphs = generatedText.split('\n').map((line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line || ' ',
              size: 24,
              font: docLanguage === 'ur' ? 'Noto Nastaliq Urdu' : 'Times New Roman',
            }),
          ],
        }),
      )
      const doc = new Document({ sections: [{ children: paragraphs }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fileBase = currentDoc?.id || 'legal-draft'
      a.href = url
      a.download = `${fileBase}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      notifyError(
        docLanguage === 'ur' ? 'ورڈ فائل' : 'Word download',
        docLanguage === 'ur' ? 'ورڈ فائل ڈاؤن لوڈ میں مسئلہ پیش آیا۔' : 'Failed to download Word file.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <FeaturePageLayout
      title={docLanguage === 'ur' ? 'قانونی دستاویز تیار کریں' : 'Legal Document Drafter'}
      subtitle={docLanguage === 'ur' ? 'ٹیمپلیٹ منتخب کریں، تفصیلات بھریں، اور ابتدائی مسودہ حاصل کریں۔' : 'Pick a legal template, fill details, and generate a printable first draft.'}
    >
      <div
        className={
          isDark
            ? 'mb-5 inline-flex rounded-lg border border-[#1e3a5f] bg-[#0b2038] p-1'
            : 'mb-5 inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm'
        }
      >
        <button
          type="button"
          onClick={() => setDocLanguage('en')}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${docLanguage === 'en' ? 'bg-[#1d4ed8] text-white' : isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setDocLanguage('ur')}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${docLanguage === 'ur' ? 'bg-[#1d4ed8] text-white' : isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}
        >
          اردو
        </button>
      </div>

      {step === 'pick' && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {docLanguage === 'ur' ? 'آپ کیا تیار کرنا چاہتے ہیں؟' : 'What do you need to draft?'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentDocTypes.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelected(doc.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  selected === doc.id
                    ? isDark
                      ? 'border-[#3b82f6] bg-[#0f2a48]'
                      : 'border-blue-500 bg-blue-50'
                    : isDark
                      ? 'border-[#1e3a5f] bg-[#0b2038] hover:border-[#3b82f6]/70'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <p className="text-xl">{doc.icon}</p>
                <p className={`mt-2 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{doc.desc}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!selected}
            onClick={() => setStep('form')}
            className="mt-4 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {docLanguage === 'ur' ? 'جاری رکھیں' : 'Continue'}
          </button>
        </div>
      )}

      {step === 'form' && currentDoc && (
        <div>
          <button
            type="button"
            onClick={() => setStep('pick')}
            className={`mb-4 text-sm ${isDark ? 'text-[#9ab4ce] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {docLanguage === 'ur' ? 'واپس →' : '← Back'}
          </button>
          <h2 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentDoc.icon} {currentDoc.name}
          </h2>
          <div className="space-y-3">
            {currentDoc.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className={`text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-700'}`}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={
                      isDark
                        ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]'
                        : 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#3b82f6]'
                    }
                  />
                ) : (
                  <input
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={
                      isDark
                        ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]'
                        : 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#3b82f6]'
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <button
            disabled={!canGenerate}
            onClick={() => {
              setGeneratedText(buildDraft(currentDoc, formData, docLanguage))
              setStep('result')
            }}
            className="mt-4 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {docLanguage === 'ur' ? 'مسودہ تیار کریں' : 'Generate Draft'}
          </button>
        </div>
      )}

      {step === 'result' && (
        <div>
          <button
            type="button"
            onClick={() => setStep('form')}
            className={`mb-4 text-sm ${isDark ? 'text-[#9ab4ce] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {docLanguage === 'ur' ? 'تفصیلات میں ترمیم →' : '← Edit details'}
          </button>
          <div
            className={`mb-3 rounded-lg border p-3 text-xs ${
              isDark
                ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {docLanguage === 'ur'
              ? 'یہ ابتدائی ڈرافٹ صرف رہنمائی کے لیے ہے۔ دستخط یا جمع کروانے سے پہلے کسی مستند وکیل سے لازماً جانچ کروائیں۔'
              : 'This is an AI-style first draft template for reference only. Please get it reviewed by a qualified advocate.'}
          </div>
          <pre
            className={`max-h-[500px] overflow-auto rounded-xl border p-4 text-xs leading-6 ${
              isDark
                ? 'border-[#1e3a5f] bg-[#0b2038] text-[#c4d8ed]'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
          >
            {generatedText}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={downloadPdf}
              disabled={isDownloading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {docLanguage === 'ur' ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download PDF'}
            </button>
            <button
              onClick={downloadDocx}
              disabled={isDownloading}
              className="rounded-lg bg-[#1a5276] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {docLanguage === 'ur' ? 'ورڈ ڈاؤن لوڈ کریں' : 'Download Word (.docx)'}
            </button>
          </div>
          <button
            type="button"
            onClick={reset}
            className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
              isDark
                ? 'border-[#1e3a5f] text-[#9ab4ce] hover:text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {docLanguage === 'ur' ? 'نیا مسودہ بنائیں' : 'Draft another'}
          </button>
        </div>
      )}
    </FeaturePageLayout>
  )
}

export default DocumentDrafterPage

