import { useQuery } from "@tanstack/react-query";
import type { RecordsQuery } from "../types/records";
import { getRecords } from "../api/records";
//TODO:: להבין את הפונקציה  useRecords
export const useRecords = (filters: RecordsQuery) => {
    return useQuery({
        queryKey: ['records', filters],
        queryFn: () => getRecords(filters)
    })
}