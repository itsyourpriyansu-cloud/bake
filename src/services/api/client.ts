import axios from 'axios'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '/api/v1', timeout: 8000 })
