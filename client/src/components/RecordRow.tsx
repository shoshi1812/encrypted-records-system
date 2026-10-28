import { Link } from "react-router-dom"
import type { RecordListItem } from "../types/records"

export const RecordRow = ({ record }: { record: RecordListItem }) => {
    const date = new Date(record.createdAt).toLocaleDateString('he-IL')

    return (
        <tr>
            <td>
                <Link to={`/records/${record.id}`}>{record.title}</Link>
            </td>
            <td>{record.category}</td>
            <td>{record.visibility}</td>
            <td>{record.senderEmail}</td>
            <td>{date}</td>
        </tr>
    )
}
