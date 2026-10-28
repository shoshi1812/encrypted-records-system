import { useState } from "react"
import type { Category, SortDirection } from "../types/records"
import { useRecords } from "../hooks/useRecords"
import { RecordRow } from "../components/RecordRow"

export const RecordPage = () => {

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<Category | ''>('')
    const [sortDirection, setSortDirection] = useState<SortDirection>('DESC')
    const filters = {
        search: search || undefined,
        category: category || undefined,
        sortDirection: sortDirection
    }
    const { data, error, isError, isPending } = useRecords(filters)

    return (<>

        <h1>הרשומות שלי</h1>
        <input type="text" value={search} onChange={({ target }) => setSearch(target.value)} placeholder="חיפוש לפי כותרת" />
        <select

            value={category}
            onChange={({ target }) => setCategory(target.value as Category | '')}>
            <option value="">כל הקטגוריות</option>
            <option value="DOCUMENT">מסמך</option>
            <option value="NOTE">פתק</option>
            <option value="CODE">קוד</option>
            <option value="OTHER">אחר</option>

        </select>


        <select
            value={sortDirection}
            onChange={({ target }) => setSortDirection(target.value as SortDirection)}>
            <option value="DESC">מהחדש לישן</option>
            <option value="ASC">מהישן לחדש</option>
        </select>


        {isPending && <p>טוען רשומות</p>}
        {isError && <p>{error?.message}</p>}
        {data && (
                <>
                    <p>מוצגות {data.totalCount} רשומות</p>

                    {data.items.length === 0 ? (
                        <p>לא נמצאו רשומות</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>כותרת</th>
                                    <th>קטגוריה</th>
                                    <th>נראות</th>
                                    <th>שולח</th>
                                    <th>תאריך</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((record) => (
                                    <RecordRow key={record.id} record={record} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}


    </>)
}



