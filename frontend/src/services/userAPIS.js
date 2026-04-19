import apiClient from './apiClient'

export const signupUser = async (payload) => {
  const { data } = await apiClient.post('/api/users/signup', payload)
  return data
}

export const verifySignup = async (payload) => {
  const { data } = await apiClient.post('/api/users/verify-signup', payload)
  return data
}

export const resendSignupOtp = async (payload) => {
  const { data } = await apiClient.post('/api/users/resend-signup-otp', payload)
  return data
}

export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/api/users/login', payload)
  return data
}
