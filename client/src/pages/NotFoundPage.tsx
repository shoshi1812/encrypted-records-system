import { Link } from "react-router-dom"

export const NotFoundPage = () => {
    return (<>

        <h1>הדף לא נמצא</h1>
        <p>הכתובת שהוזנה לא קיימת</p>
        <Link to='/records'>חזרה לדף הבית</Link>
    </>)
}



