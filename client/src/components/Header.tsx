import { NavLink } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export const Header = () => {
    const { user, logout } = useAuth()
return(
    <header>
        <nav>
            <NavLink to='/records' end>הרשומות שלי</NavLink>
            <NavLink to='/records/new'>הוספת רשומה</NavLink>
        </nav>
        <span>{user?.email}</span>
        <span>{user?.role}</span>
        <button type="button" onClick={logout}>התנתקות</button>
    </header>
)
}