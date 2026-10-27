import axios from "axios";
import type { ApiError } from '../types/api'
export const TOKEN_KEY = 'token'
export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`
})
apiClient.interceptors.request.use((config) => {

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {

        const status = error.response?.status
        const url = error.config?.url
        if (status === 401 && url !== '/auth/login') {
            localStorage.removeItem(TOKEN_KEY)
            window.location.href = '/login'
        }
        const apiError: ApiError = error.response?.data ?? {
            errorCode:'NETWORK_ERROR',
            message:'לא ניתן להתחבר לשרת. נסי שוב מאוחר יותר'
        }
         return Promise.reject(apiError)
    }
)
