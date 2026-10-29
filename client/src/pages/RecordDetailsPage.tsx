import { Link, useParams } from "react-router-dom"
import { useRecord } from "../hooks/useRecords"
import { useAuth } from "../hooks/useAuth"

export const RecordDetailsPage = () => {

    const { id } = useParams()
    const { data: record, isPending, isError, error } = useRecord(id!)
    const { user } = useAuth()
    if (isPending) return <p>טוען...</p>
    if (isError) return <p>{error.message}</p>
    const isOwner = user?.email === record.senderEmail
    
    
    return (<>

        <h1>{record?.title}</h1>
        {record.description && <p>תיאור: {record.description}</p>}
        <p>קטגוריה: {record.category}</p>
        <p>נראות: {record.visibility}</p>
        <p>שולח: {record.senderEmail}</p>
        {record.recipientEmail && <p>נמען: {record.recipientEmail}</p>}
        <p>נוצרה: {new Date(record.createdAt).toLocaleDateString('he-IL')}</p>
        <h2>תוכן</h2>
        {record.content !== null ? <pre>{record.content}</pre> : <p>התוכן זמין לשולח ולנמען בלבד</p>}
          {isOwner && <Link to={`/records/${record.id}/edit`}>עריכה</Link>}
        {' '}
        <Link to="/records">חזרה לרשימה</Link>
    </>)
}



