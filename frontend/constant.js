const envUrl = import.meta.env.VITE_API_BASE_URL
const normalized = envUrl && /:517\d/.test(envUrl) ? 'http://localhost:8000' : envUrl

export const API_KEY = normalized || 'http://localhost:8000'
