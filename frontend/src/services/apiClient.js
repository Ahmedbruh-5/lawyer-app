import axios from 'axios'

const envUrl = import.meta.env.VITE_API_BASE_URL
const normalized = envUrl && /:517\d/.test(envUrl) ? 'http://localhost:8000' : envUrl

const API_BASE_URL = normalized || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
