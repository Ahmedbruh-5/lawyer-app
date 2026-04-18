import apiClient from './apiClient'

export const signupUser = async (payload) => {
  const { data } = await apiClient.post('/api/users/signup', payload)
  return data
}

export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/api/users/login', payload)
  return data
}
