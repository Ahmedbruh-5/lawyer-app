import apiClient from './apiClient'

export const getSanctions = async ({ query = '', page = 1, limit = 50 } = {}) => {
  const { data } = await apiClient.get('/api/sanctions', {
    params: { query: query || undefined, page, limit },
  })
  return data
}

export const getSanctionById = async (id) => {
  const { data } = await apiClient.get(`/api/sanctions/${id}`)
  return data
}