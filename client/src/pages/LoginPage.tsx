import { useForm } from "react-hook-form"
import type { AuthCredentials } from "../types/user"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { login as loginRequest } from "../api/auth"


export const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<AuthCredentials>()

    const { login } = useAuth()
    const navigate = useNavigate()




    const loginMutation = useMutation({
        mutationFn: loginRequest,
        onSuccess: (data) => {
            login(data)
            navigate('/records')
        }

    })




    const onSubmit = (values: AuthCredentials) => {
        loginMutation.mutate(values)

    }

    return (<>

        <h1>כניסה</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

            <label htmlFor="email">email</label>
            <input type="email" id="email"  {...register('email', { required: 'יש להזין כתובת אימייל' })} />
            {errors.email && <p>{errors.email.message}</p>}

            <label htmlFor="password">password</label>
            <input type="password" id="password"  {...register('password', { required: 'יש להזין סיסמא' })} />
            {errors.password && <p>{errors.password.message}</p>}

            {loginMutation.isError && <p>{(loginMutation.error).message}</p>}

            <button type="submit" disabled={loginMutation.isPending}> {loginMutation.isPending ? 'מתחבר...' : 'התחברות'}</button>
        </form>
    </>)
}




