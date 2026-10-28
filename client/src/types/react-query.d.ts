import '@tanstack/react-query'
import type { ApiError } from './api'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}