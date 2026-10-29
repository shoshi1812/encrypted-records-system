import { useForm } from 'react-hook-form'
import type { CreateRecordRequest, UpdateRecordRequest } from '../types/records'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecord, updateRecord } from '../api/records'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecord } from '../hooks/useRecords'
import { useEffect } from 'react'


export const RecordFormPage = () => {
    const { id } = useParams()
    const isEdit = id !== undefined
    const recordQuery = useRecord(id)

    const { formState: { errors }, reset, register, handleSubmit, watch } = useForm<CreateRecordRequest>({ defaultValues: { category: 'NOTE', visibility: 'PRIVATE' } })

    const queryClient = useQueryClient()
    const navigate = useNavigate()

    useEffect(() => {
        if (recordQuery.data) {
            const r = recordQuery.data
            reset({ title: r.title, description: r.description ?? '', category: r.category, visibility: r.visibility, content: r.content ?? '' })
        }
    }, [recordQuery.data, reset])



    const createMutation = useMutation({
        mutationFn: createRecord,
        onSuccess: (record) => {
            queryClient.invalidateQueries({ queryKey: ['records'] })
            navigate(`/records/${record.id}`)
        }
    })

    const updateMutation = useMutation({
        mutationFn: (values: UpdateRecordRequest) => updateRecord(id!, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['records'] })
            queryClient.invalidateQueries({ queryKey: ['record', id] })
            navigate(`/records/${id}`)
        },
    })
    const onSubmit = (values: CreateRecordRequest) => {
        const description = values.description || undefined
        if (isEdit) {
            updateMutation.mutate({ title: values.title, description: values.description, category: values.category, visibility: values.visibility, content: values.content })
        } else {
            createMutation.mutate({ ...values, description })
        }
    }

    const mutation = isEdit ? updateMutation : createMutation
    // מונה תווים: watch מחזיר את הערך העדכני של התוכן בכל הקלדה
    const content = watch('content') ?? ''
    if (isEdit && recordQuery.isPending) return <p>טוען...</p>
    if (isEdit && recordQuery.isError) return <p>{recordQuery.error.message}</p>
    return (<>
        <h1>{isEdit ? 'עריכת רשומה' : 'רשומה חדשה'}</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

            <div>
                <label htmlFor="title">כותרת</label>
                <input id="title" type="text" {...register('title', { required: 'כותרת היא שדה חובה', maxLength: { value: 150, message: 'עד 150 תווים' } })} />
                {errors.title && <p>{errors.title.message}</p>}
            </div>

            <div>
                <label htmlFor="description">תיאור (לא חובה)</label>
                <input id="description" type="text" {...register('description', { maxLength: { value: 300, message: 'עד 300 תווים' } })} />
                {errors.description && <p>{errors.description.message}</p>}
            </div>


            {isEdit ? (
                <p>נמען: {recordQuery.data?.recipientEmail}</p>
            ) : (
                <div>
                    <label htmlFor="recipientEmail">אימייל הנמען</label>
                    <input id="recipientEmail" type="email" {...register('recipientEmail', {
                        required: 'אימייל הנמען הוא שדה חובה',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'כתובת אימייל לא תקינה' },
                    })} />
                    {errors.recipientEmail && <p>{errors.recipientEmail.message}</p>}
                </div>
            )}


            <div>
                <label htmlFor="category">קטגוריה</label>
                <select id="category" {...register('category')}>
                    <option value="DOCUMENT">מסמך</option>
                    <option value="NOTE">פתק</option>
                    <option value="CODE">קוד</option>
                    <option value="OTHER">אחר</option>
                </select>
            </div>

            <div>
                <label htmlFor="visibility">נראות</label>
                <select id="visibility" {...register('visibility')}>
                    <option value="PRIVATE">פרטית</option>
                    <option value="PUBLIC">ציבורית</option>
                </select>
            </div>

            <div>

                <label htmlFor="content">תוכן</label>
                {isEdit && <p>שמירה תחליף את התוכן הקודם</p>}
                <textarea id="content" rows={8} {...register('content', {
                    required: 'תוכן הוא שדה חובה',
                    maxLength: { value: 20000, message: 'עד 20000 תווים' },
                })} />
                <p>{content.length} / 20000</p>
                {errors.content && <p>{errors.content.message}</p>}
            </div>

            {mutation.isError && <p>{mutation.error.message}</p>}
            <button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'שומר...' : 'שמירה'}</button>
        </form>
    </>)
}