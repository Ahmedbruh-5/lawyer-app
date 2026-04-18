import apiClient from './apiClient'

export const getStatutes = async ({
  search = '',
  type = '',
  year = '',
  page = 1,
  limit = 4,
  includeText = true,
} = {}) => {
  const { data } = await apiClient.get('/api/statutes', {
    params: {
      search: search || undefined,
      type: type || undefined,
      year: year || undefined,
      page,
      limit,
      includeText,
    },
  })

  return data
}

export const getStatuteById = async (id) => {
  const { data } = await apiClient.get(`/api/statutes/${id}`)
  return data
}

export const getStatuteFiltersMeta = async () => {
  const { data } = await apiClient.get('/api/statutes/filters/meta')
  return data
}

