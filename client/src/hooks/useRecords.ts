import { useQuery } from "@tanstack/react-query";
import type { RecordsQuery } from "../types/records";
import { getRecord, getRecords } from "../api/records";
//TODO:: להבין את הפונקציות  
export const useRecords = (filters: RecordsQuery) => {
    return useQuery({
        queryKey: ['records', filters],
        queryFn: () => getRecords(filters)
    })


}
export const useRecord = (id?: string) => useQuery({
  queryKey: ['record', id],
  queryFn: () => getRecord(id!),
  enabled: id !== undefined,
})