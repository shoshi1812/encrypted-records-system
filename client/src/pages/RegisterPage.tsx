import { useForm } from "react-hook-form"
import type { AuthCredentials } from "../types/user"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { register as registerRequest } from "../api/auth"
type RegisterFormValues = AuthCredentials & { confirmPassword: string }

export const RegisterPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>()

    const { login } = useAuth()
    const navigate = useNavigate()




    const registerMutation = useMutation({
        mutationFn: registerRequest,
        onSuccess: (data) => {
            login(data)
            navigate('/records')
        }

    })




    const onSubmit = (values: AuthCredentials) => {
        registerMutation.mutate(values)

    }

    return (<>

        <h1>כניסה</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

            <label htmlFor="email">email</label>
            <input type="email" id="email"  {...register('email', { required: 'יש להזין כתובת אימייל', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'כתובת אימייל לא תקינה' } })} />
            {errors.email && <p>{errors.email.message}</p>}

            <label htmlFor="password">password</label>
            <input type="password" id="password"  {...register('password', { required: 'יש להזין סיסמא', minLength: { value: 8, message: 'לפחות 8 תווים' }, pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'הסיסמה חייבת לכלול אות ומספר' } })} />
            {errors.password && <p>{errors.password.message}</p>}

            {registerMutation.isError && <p>{(registerMutation.error).message}</p>}
            <label htmlFor="confirmPassword">אימות סיסמא</label>
            <input type="password" id="confirmPassword"  {...register('confirmPassword', { required: 'יש לאמת את הסיסמה', validate: (value, formValues) => value === formValues.password || 'הסיסמאות אינן תואמות' })} />
           
            {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
            <button type="submit" disabled={registerMutation.isPending}> {registerMutation.isPending ? 'מתחבר...' : 'התחברות'}</button>
        </form>
    </>)
}




