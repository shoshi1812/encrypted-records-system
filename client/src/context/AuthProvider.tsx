import { useEffect, useState, type ReactNode } from "react";
import { TOKEN_KEY } from "../api/client";
import { AuthContext } from "./AuthContext";
import type { AuthResponse, User } from "../types/user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "../api/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null)
    const queryClient = useQueryClient();
    const login = (data: AuthResponse) => {
        localStorage.setItem(TOKEN_KEY, data.accessToken)
        setToken(data.accessToken)
        setUser(data.user)
    }
    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        queryClient.clear()
    }


    const meQuery = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
        enabled: token !== null && user === null,
        retry: false
    })
    const isLoading = token !== null && user === null && !meQuery.isError
 
    useEffect(() => {

        if (meQuery.data) {
            setUser(meQuery.data)
        }
    }, [meQuery.data])

    return <AuthContext.Provider value={{
        user, token, isLoading, logout, login
    }}>
        {children}

    </AuthContext.Provider >

}




