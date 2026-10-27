export type Category = 'DOCUMENT' | 'NOTE' | 'CODE' | 'OTHER'
export type Visibility = 'PRIVATE' | 'PUBLIC'
export type SortDirection = 'ASC' | 'DESC'
export type RecordListItem = {
    id: string,
    title: string,
    description: string | null,
    category: Category,
    visibility: Visibility,
    createdAt: string,
    senderEmail: string
}
export type RecordsListResponse = {
    items: RecordListItem[],
    page: number,
    pageSize: number,
    totalCount: number

}
export type RecordDetails =
    RecordListItem & {
        recipientEmail: string | null,
        content: string | null
    }

export type RecordsQuery = {
    search?: string,
    category?: Category,
    sortDirection?: SortDirection,
    pageSize?: number
}
export type CreateRecordRequest = {
    title: string,
    description?: string,
    recipientEmail: string,
    category: Category,
    visibility: Visibility,
    content: string
}
export type UpdateRecordRequest = {
    title: string,
    description?: string,
    category: Category,
    visibility: Visibility,
    content?: string
}