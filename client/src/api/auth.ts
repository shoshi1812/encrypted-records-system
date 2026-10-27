import type { AuthCredentials, AuthResponse, User } from "../types/user"
import { apiClient } from "./client"

export const login = async (authCredentials: AuthCredentials) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', authCredentials)
    return response.data
}

export const register = async (authCredentials: AuthCredentials) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', authCredentials)
    return response.data

}
export const getMe = async ()=>{
    const response = await apiClient.get<User>('/auth/me')
    return response.data
}