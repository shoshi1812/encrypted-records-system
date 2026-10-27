export type Role = 'ADMIN' | 'USER'

export type User = {
    id: string,
    email: string,
    role: Role
}
export type AuthCredentials = {
    email: string,
    password: string
}
export type AuthResponse = {
    accessToken: string,
    tokenType: string,
    expiresIn: number,
    user: User

}