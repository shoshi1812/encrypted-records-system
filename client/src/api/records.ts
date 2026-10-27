import type { CreateRecordRequest, RecordDetails, RecordListItem, RecordsListResponse, RecordsQuery, UpdateRecordRequest } from "../types/records";
import { apiClient } from "./client";

export const getRecords = async (query: RecordsQuery) => {
    const response = await apiClient.get<RecordsListResponse>('/cipher-records',{params:{ pageSize:100,...query}});
    return response.data
}

export const getRecord = async (id: string) => {
    const response = await apiClient.get<RecordDetails>(`/cipher-records/${id}`)
    return response.data
}

export const createRecord = async (data: CreateRecordRequest) => {
    const response = await apiClient.post<RecordListItem>('/cipher-records', data)
    return response.data
}

export const updateRecord = async (id: string, data: UpdateRecordRequest) => {
    const response = await apiClient.put<RecordListItem>(`/cipher-records/${id}`, data)
    return response.data
}
