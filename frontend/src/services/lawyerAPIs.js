import apiClient from './apiClient'

export const getLawyers = async ({ q = '' } = {}) => {
  const { data } = await apiClient.get('/api/lawyers', {
    params: { q: q || undefined },
  })
  return data
}

export const addLawyer = async (payload) => {
  const { data } = await apiClient.post('/api/lawyers', payload)
  return data
}

export const updateLawyer = async (id, payload) => {
  const { data } = await apiClient.put(`/api/lawyers/${id}`, payload)
  return data
}

export const deleteLawyer = async (id) => {
  const { data } = await apiClient.delete(`/api/lawyers/${id}`)
  return data
}

