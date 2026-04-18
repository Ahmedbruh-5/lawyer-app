import apiClient from './apiClient'

export const getPenalCodes = async ({ q = '', limit = 200 } = {}) => {
  const { data } = await apiClient.get('/api/penal-codes', {
    params: { q, limit },
  })
  return data
}

export const importPenalCodes = async () => {
  const { data } = await apiClient.post('/api/penal-codes/import')
  return data
}
