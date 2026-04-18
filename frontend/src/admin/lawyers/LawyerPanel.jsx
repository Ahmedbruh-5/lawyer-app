import { useEffect, useState } from 'react'
import { addLawyer, getLawyers } from '../../services/lawyerAPIs'

function LawyerPanel() {
  const [lawyers, setLawyers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    location: '',
    rate: '',
    phone: '',
    email: '',
    bio: '',
  })

  const fetchLawyers = async (q = '') => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getLawyers({ q })
      setLawyers(data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lawyers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLawyers(search)
  }, [search])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      await addLawyer(form)
      setForm({ name: '', specialty: '', location: '', rate: '', phone: '', email: '', bio: '' })
      await fetchLawyers(search)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lawyer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Lawyer Management</h2>

      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Lawyer</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Full name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <input
            value={form.specialty}
            onChange={(event) => setForm((prev) => ({ ...prev, specialty: event.target.value }))}
            placeholder="Specialty"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <input
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Location"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <input
            value={form.rate}
            onChange={(event) => setForm((prev) => ({ ...prev, rate: event.target.value }))}
            placeholder="Rate (e.g. PKR 10,000 / hearing)"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Phone number"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email address"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
          <textarea
            value={form.bio}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            placeholder="Short bio (optional)"
            className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Lawyer'}
        </button>
      </form>

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search lawyers by name, specialty, location, phone, or email..."
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
        />
      </div>

      {isLoading && <p className="mb-3 text-sm text-slate-500">Loading lawyers...</p>}
      {!!error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lawyers.map((lawyer) => (
          <article key={lawyer._id || lawyer.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{lawyer.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{lawyer.specialty}</p>
            {lawyer.bio && <p className="mt-2 line-clamp-3 text-xs text-slate-600">{lawyer.bio}</p>}
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>{lawyer.phone}</p>
              <p className="truncate">{lawyer.email}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>{lawyer.location}</span>
              <span>{lawyer.rate}</span>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && !lawyers.length && !error && (
        <p className="mt-4 text-sm text-slate-500">No lawyers found.</p>
      )}
    </div>
  )
}

export default LawyerPanel

