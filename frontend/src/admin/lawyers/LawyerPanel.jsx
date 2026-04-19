import { useEffect, useState } from 'react'
import { addLawyer, getLawyers, updateLawyer, deleteLawyer } from '../../services/lawyerAPIs'
import { confirmDanger, notifyError, notifySuccess } from '../../utils/swal'

const emptyForm = {
  name: '',
  specialty: '',
  location: '',
  rate: '',
  phone: '',
  email: '',
  bio: '',
  verified: true,
}

function LawyerPanel() {
  const [lawyers, setLawyers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const fetchLawyers = async (q = '') => {
    try {
      setIsLoading(true)
      const data = await getLawyers({ q })
      setLawyers(data.data || [])
    } catch (err) {
      notifyError('Could not load lawyers', err.response?.data?.message || 'Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLawyers(search)
  }, [search])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (lawyer) => {
    setEditingId(lawyer._id)
    setForm({
      name: lawyer.name || '',
      specialty: lawyer.specialty || '',
      location: lawyer.location || '',
      rate: lawyer.rate || '',
      phone: lawyer.phone || '',
      email: lawyer.email || '',
      bio: lawyer.bio || '',
      verified: lawyer.verified !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        location: form.location.trim(),
        rate: form.rate.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
        verified: form.verified,
      }
      if (editingId) {
        await updateLawyer(editingId, payload)
        resetForm()
        notifySuccess('Saved', 'Lawyer profile was updated.')
      } else {
        await addLawyer(payload)
        setForm(emptyForm)
        notifySuccess('Added', 'Lawyer profile was created.')
      }
      await fetchLawyers(search)
    } catch (err) {
      notifyError(
        editingId ? 'Could not update lawyer' : 'Could not add lawyer',
        err.response?.data?.message || 'Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    const ok = await confirmDanger({
      title: 'Delete lawyer?',
      text: `Delete lawyer profile for "${name}"? This cannot be undone.`,
      confirmText: 'Yes, delete',
    })
    if (!ok) return
    try {
      setDeletingId(id)
      await deleteLawyer(id)
      if (editingId === id) resetForm()
      await fetchLawyers(search)
      notifySuccess('Deleted', 'Lawyer profile was removed.')
    } catch (err) {
      notifyError('Could not delete lawyer', err.response?.data?.message || 'Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Lawyer Management</h2>

      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Edit lawyer' : 'Add Lawyer'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel edit
            </button>
          )}
        </div>
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
          <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(event) => setForm((prev) => ({ ...prev, verified: event.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Verified profile (shown as verified on public profile)</span>
          </label>
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
          {submitting ? (editingId ? 'Saving...' : 'Adding...') : editingId ? 'Save changes' : 'Add Lawyer'}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lawyers.map((lawyer) => (
          <article key={lawyer._id || lawyer.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{lawyer.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{lawyer.specialty}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(lawyer)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === lawyer._id}
                  onClick={() => handleDelete(lawyer._id, lawyer.name)}
                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === lawyer._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
            {lawyer.bio && <p className="mt-2 line-clamp-3 text-xs text-slate-600">{lawyer.bio}</p>}
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>{lawyer.phone}</p>
              <p className="truncate">{lawyer.email}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>{lawyer.location}</span>
              <span>{lawyer.rate}</span>
            </div>
            {lawyer.verified === false && (
              <p className="mt-2 text-xs font-medium text-amber-700">Not verified</p>
            )}
          </article>
        ))}
      </div>

      {!isLoading && !lawyers.length && (
        <p className="mt-4 text-sm text-slate-500">No lawyers found.</p>
      )}
    </div>
  )
}

export default LawyerPanel
