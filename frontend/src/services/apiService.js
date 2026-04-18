import apiClient from './apiClient'

export const userAPI = {
  addUser: (payload) =>
    apiClient.post('/api/users/signup', {
      ...payload,
      fullName: payload.name,
      accessLevel:
        payload.accessLevel?.toLowerCase() === 'pro' ? 'Pro' : 'Free',
    }),
}

export const authAPI = {
  getCurrentUser: () => apiClient.get('/api/users/me'),
}
