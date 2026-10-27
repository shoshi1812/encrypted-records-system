import { createContext } from "react"
import type { AuthResponse, User } from "../types/user"
type AuthContextValue ={
    user: User | null,
    token: string | null,
    isLoading: boolean,
    login: (data: AuthResponse) => void,
    logout: () => void

}
export const AuthContext = createContext<AuthContextValue | null>(null)
